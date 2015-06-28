#!/usr/bin/env node

// Module: routes-builder-gen.js
//
// Command line tool to generate a routes-builder based project
//
// To run during development:
// Setup: Have routes-builder and routes-builder-demo-project projects in the same folder
// $ cd routes-builder
// $ npm link ../routes-builder-demo-project (to make sure you are using local dev version of project)
// $ export NODE_ENV=development DEBUG=routes-builder-gen ./bin/routes-builder-gen.js -p myNewProject
//
// To test the built app:
// $ cd myNewProject
// $ mkdir node_modules
// $ npm link ../routes-builder (to make sure you are using local dev version of project)
// $ npm install
// $ npm start
//
// (1) SCOPE VARIABLES, (2) UTILITY METHODS, (3) MAIN

//--------------- BEGIN MODULE SCOPE VARIABLES ---------------
var
  debug = require('debug')('routes-builder-gen'),
  fs    = require('fs'),
  path  = require('path'),
  argv  = require('minimist')(process.argv.slice(2)),
  clone = require('git-clone'),

  _printConfigMap,
  _printHelp,
  _getSourceDir,
  _drawProjectDescription,
  _printErrorAndExit,
  _createProject,
  _buildRoute,
  _buildRouteFile,
  _buildHandlersFile,
  _findLongestItems,
  _addQuotesAndSpaces,
  _removeFormatRoutes,
  _writeFile,

  routeFile = {
    prefix: '',
    default_middleware: [ ],
    routes: [
      [ 'get'    , ''                 , [ ] , '.index'   ],
      [ 'get'    , '.format'          , [ ] , '.index'   ],
      [ 'get'    , '/new'             , [ ] , '.new'     ],
      [ 'get'    , '/new.format'      , [ ] , '.new'     ],
      [ 'post'   , ''                 , [ ] , '.create'  ],
      [ 'post'   , '.format'          , [ ] , '.create'  ],
      [ 'get'    , '/:id'             , [ ] , '.show'    ],
      [ 'get'    , '/:id.format'      , [ ] , '.show'    ],
      [ 'get'    , '/:id/edit'        , [ ] , '.edit'    ],
      [ 'get'    , '/:id/edit.format' , [ ] , '.edit'    ],
      [ 'post'   , '/:id'             , [ ] , '.update'  ],
      [ 'post'   , '/:id.format'      , [ ] , '.update'  ],
      [ 'delete' , '/:id'             , [ ] , '.destroy' ],
      [ 'delete' , '/:id.format'      , [ ] , '.destroy' ]
    ]
  },
  handlers = ['index', 'new', 'create', 'show', 'edit', 'update', 'destroy'],
  configMap = {};
//---------------- END MODULE SCOPE VARIABLES ----------------

//------------------- BEGIN UTILITY METHODS ------------------
_printConfigMap = function() {
  Object.keys(configMap).forEach(function(key) {
    debug('configMap: ' + key + ": " + JSON.stringify(configMap[key], null, 2));
  });
};

_printHelp = function() {
  console.log('\033[36m' + "usage:" + '\033[39m');
  console.log(' $ routes-builder [options]');
  console.log('');
  console.log('\033[36m' + "examples:" + '\033[39m');
  console.log(' $ routes-builder -p myNewWebProject');
  console.log(' $ routes-builder -f -r users');
  console.log('' );
  console.log('\033[36m' + "options:" + '\033[39m');
  console.log(' -p, --project    [name]   generate a project');
  console.log(' -d, --definition [name]   specify the route definition script (defaults to routes-builder)');
  console.log(' -c, --creation   [name]   specify the route creation script (defaults to express)');
  console.log('');
  console.log(' -r, --routes     [name]   creates restful routes and handlers');
  console.log(' -f, --format              flag to create restful routes including format routes');
  process.exit(0);
};

_getSourceDir = function() {
  return configMap.baseDirSource;
};

_drawProjectDescription = function(proj) {
  console.log('');
  console.log('Created new project:');
  console.log('');
  console.log('\033[36m' + proj + '\033[39m');
  console.log('\033[36m|');
  console.log('\033[36m|-app.js\033[39m       - file that contains the application configuration');
  console.log('\033[36m|-handlers\033[39m     - folder for route handler functions');
  console.log('\033[36m|-lib\033[39m          - folder for other functionality modules you create');
  console.log('\033[36m|-middleware\033[39m   - folder for per route middleware functions');
  console.log('\033[36m|-package.json\033[39m - file containing npm package information about your project');
  console.log('\033[36m|-public\033[39m       - folder for css, javascript, images and other front end stuff');
  console.log('\033[36m|-routes\033[39m       - folder for route definitions');
  console.log('\033[36m|-test\033[39m         - folder for unit tests');
  console.log('\033[36m--views\033[39m        - folder for views');
  console.log('');
  console.log('Next steps:');
  console.log('  \033[36m$ cd ' + proj + ' && npm install\033[39m (install dependencies)');
  console.log('  \033[36m$ export NODE_ENV=development DEBUG=routes-builder:*\033[39m (export environment variables)');
  console.log('  \033[36m$ npm start\033[39m (run the app)');
  console.log('');
};

_printErrorAndExit = function(loc, err) {
  console.log("Error: " + loc);
  console.log(JSON.stringify(err, null, 2));
  console.log("");
  process.exit(0);
};

_createProject = function() {
  var rel_path, options = {};

  options.filter = function (filename) {
    debug('running options.filter(filename): filename: '+ filename);
    rel_path = filename.substr(configMap.src.length, filename.length);
    if ((path.basename(filename).indexOf('.') === 0) || (rel_path.indexOf('node_modules') > 0)) {
      debug('running options.filter(filename): returning false');
      return false;
    }
    debug('running options.filter(filename): returning true');
    return true;
  };

  clone(configMap.demo_proj_git_path, configMap.proj_dir, {}, function(err) {
    if (err) { throw err; }
    debug('Cloned repository: ' + configMap.demo_proj_name + ' to ' + configMap.proj_dir);
    _drawProjectDescription(configMap.proj_name);
  });
};

_buildRoute = function() {
  var routes = routeFile.routes;
  for(var ctr = 0; ctr < routes.length; ctr++) {
    routes[ctr][1] = routes[ctr][1];
    routes[ctr][3] = configMap.routeName.concat(routes[ctr][3]);
  }

  var filename = configMap.routeName + '.js';

  var route_dir = path.join(process.cwd(), 'routes');
  var route_file_contents = _buildRouteFile();

  var handlers_dir = path.join(process.cwd(), 'handlers');
  var handlers_file_contents = _buildHandlersFile();

  _writeFile(route_dir, filename, route_file_contents, function(err, file_path1) {
    if (err) { return console.log('Error creating file: ' + err.message); }

    _writeFile(handlers_dir, filename, handlers_file_contents, function(err, file_path2) {
      if (err) { return console.log('Error creating file: ' + err.message); }
      console.log('');
      console.log('Created Restful Routes:');
      console.log('');
      console.log('\033[36mCreated routes file: \033[39m' + file_path1);
      console.log('\033[36mCreated handlers file: \033[39m' + file_path2);
      console.log('');
    });
  });
};

_buildRouteFile = function() {
  var len, m_spaces, p_spaces, h_spaces, r_string, ctr = 0;

  var content = String()
    + "module.exports = {\n"
    + "  prefix: '/" + configMap.routeName + "',\n"
    + "  default_middleware: [ ],\n"
    + "  routes: [\n";

  len = _findLongestItems();

  routeFile.routes.forEach (function(route) {
    m_spaces = len.method_len - route[0].length + 1;
    p_spaces = len.path_len - route[1].length + 1;
    h_spaces = len.handler_len - route[3].length + 1;

    route[0] = _addQuotesAndSpaces(route[0], m_spaces);
    route[1] = _addQuotesAndSpaces(route[1], p_spaces);
    route[3] = _addQuotesAndSpaces(route[3], h_spaces);
    r_string = "    [ " + route[0] + ", " + route[1] + ", [ ] , " + route[3] + "]";

    if (ctr !== routeFile.routes.length - 1) {
      r_string += ',';
    }

    ctr++;
    content += r_string + "\n";
  });
  content += "  ]\n";
  content += "};";
  return content;
};

_buildHandlersFile = function() {
  var ctr = 0;

  var content = String()
    + "module.exports = {\n";

  handlers.forEach(function (handler) {
    content += "  '" + handler + "': function (req, res) { ";
    content += "res.send('This is the " + configMap.routeName + "." + handler + " handler'); }";

    if (ctr !== handlers.length - 1) {
      content += ",\n";
    }
    ctr++;
  });
  content += "\n};";
  return content;
};

_findLongestItems = function() {
  var
    method_len  = 0,
    path_len    = 0,
    handler_len = 0;

  routeFile.routes.forEach ( function (route) {
    if (route[0].length > method_len) {
      method_len = route[0].length;
    }
    if (route[1].length > path_len) {
      path_len = route[1].length;
    }
    if (route[3].length > handler_len) {
      handler_len = route[3].length;
    }
  });

  return {
    method_len  : method_len,
    path_len    : path_len,
    handler_len : handler_len
  };
};

_addQuotesAndSpaces = function(str, num) {
  var ctr, new_str = "'" + str + "'";
  for(ctr = 0; ctr < num; ctr++) {
    new_str += ' ';
  }
  return new_str;
};

_removeFormatRoutes = function() {
  var ctr, routes = [];
  for (ctr = 0; ctr < routeFile.routes.length; ctr = ctr + 2) {
    routes.push(routeFile.routes[ctr]);
  }
  routeFile.routes = routes;
};

_writeFile = function(directory, filename, content, cb) {
  var file_path = path.join(directory, filename);
  fs.stat(directory, function(err, stats) {
    if (err) return cb(new Error('Directory does not exist: ' + directory), file_path);
    if (stats.isDirectory()) {
      fs.writeFile(file_path, content, function (err) {
        if (err) return cb(err, file_path);
        cb(null, file_path);
      });
    }
    else {
      cb(new Error('Directory does not exist: ' + directory), file_path);
    }
  });

};
//-------------------- END UTILITY METHODS -------------------

//-------------------------- MAIN ----------------------------
configMap.debug              = process.env.DEBUG || false;
configMap.env                = process.env.NODE_ENV || 'production';
configMap.args               = argv;
configMap.format             = false;
configMap.__dirname          = __dirname;
configMap.routes_builder_dir = path.join(__dirname, '..');
configMap.demo_proj_name     = 'routes-builder-demo-project';
configMap.demo_proj_path     = path.join(configMap.routes_builder_dir, '..', configMap.demo_proj_name);
configMap.demo_proj_git_path = 'https://github.com/mjgs/routes-builder-demo-project.git';

(configMap.env === 'development') ?
  configMap.demo_proj_install_name = configMap.demo_proj_path :
  configMap.demo_proj_install_name = configMap.demo_proj_name;

Object.keys(configMap.args).forEach(function (arg) {
  switch (arg) {
    case 'h':
    case 'help':
      _printHelp();
      break;
    case 'p':
    case 'project':
      configMap.proj_name = configMap.args[arg];
      configMap.proj_dir = path.join(process.cwd(), configMap.proj_name);
      break;
    case 'r':
    case 'routes':
      configMap.routeName = configMap.args[arg];
      break;
    case 'f':
    case 'format':
      configMap.format = true;
      break;
    case 'd':
    case 'definition':
      configMap.definition = configMap.args[arg];
      break;
    case 'c':
    case 'creation':
      configMap.creation = configMap.args[arg];
  }
});

if (configMap.debug) {
  _printConfigMap();
}

if (!configMap.format) {
  _removeFormatRoutes();
}

if (configMap.proj_name) {
  fs.exists(configMap.proj_dir, function(exists) {
    if (exists) {
      console.log( "Project directory already exists: " + configMap.proj_dir);
      process.exit(0);
    }
    else {
      _createProject();
    }
  });
}

if (configMap.routeName) {
  _buildRoute();
}
//------------------------ END MAIN --------------------------