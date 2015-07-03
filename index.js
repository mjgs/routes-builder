// Module: index.js
//
// Loads specified route-definition and route-build functions then uses them to
// setup routes
//
// (1) SCOPE VARIABLES, (2) UTILITY METHODS, (3) MODULE EXPORTS

//---------------- BEGIN MODULE SCOPE VARIABLES --------------
var
  debug  = require('debug')('routes-builder:index'),
  path = require('path'),
  async = require('async'),
  express = require('express'),
  sprintf = require('sprintf-js').sprintf,

  RoutesTable = require('./lib/RoutesTable'),
  DirectoryLoader = require('./lib/DirectoryLoader'),

  _loader,
  _builder,

  routes_table;
//---------------- END MODULE SCOPE VARIABLES ----------------

//------------------- BEGIN UTILITY METHODS ------------------
_loader = function(options, cb) {
  var options, cb, map;

  if (!cb && typeof options === 'function') {
    cb = options;
    options = {};
  }

  debug('loading routes map');
  var directory_loader = new DirectoryLoader();

  async.parallel([
    // Routes
    function(callback) {
      directory_loader.loadDirectory(options.dirs.routes, function(err, routes) {
        if (err) callback(err, null);
        callback(null, routes);
      });
    },
    // Middleware
    function(callback) {
      directory_loader.loadDirectory(options.dirs.middleware, function(err, middleware) {
        if (err) callback(err, null);
        callback(null, middleware);
      });
    },
    // Handlers
    function(callback) {
      directory_loader.loadDirectory(options.dirs.handlers, function(err, handlers) {
        if (err) callback(err, null);
        callback(null, handlers);
      });
    }
  ], function(err, results) {
    if (err) { return cb(err, null); }
    debug('routes map loaded');
    map = {
      routes: results[0],
      middleware: results[1],
      handlers: results[2]
    };
    cb(null, map);
  });

};

_builder = function(app, map, cb) {
  if (!map) cb(new Error('Routes map is empty'), null);

  var app = app;
  var map = map;

  // Iterate over the route definition files
  Object.keys(map.routes).forEach(function(definition) {
    var prefix                 = map.routes[definition].prefix || '/';
    var default_middleware     = map.routes[definition].default_middleware;
    var routes                 = map.routes[definition].routes;
    var default_middleware_fns = routes_table.resolveMiddlewareFunctions(default_middleware);
    var router                 = express.Router();

    debug(sprintf('%s router: created', definition));

    // Add default middleware to the router
    if (default_middleware_fns && default_middleware_fns.length > 0) {
      router.use(default_middleware_fns);
    }
    debug(sprintf('%s router: added default middleware: %s ', definition, default_middleware || 'none'));

    // Iterate over the routes in the definition file
    routes.forEach(function(route) {
      var method      = route[0];
      var path        = route[1];
      var middlewares = route[2];
      var handler     = route[3];
      var middleware_fns, handler_fn;

      if ((path !== '/') && (path[path.length - 1] === '/' )) {
        path = path.substr(0, path.length - 1);
      }

      middleware_fns = routes_table.resolveMiddlewareFunctions(middlewares);
      handler_fn = routes_table.resolveHandlerFunction(handler);

      // Add the route to the router
      router[method](path, middleware_fns, handler_fn);
      debug(sprintf('%s router: added route: %s %s -> %s -> %s', definition, method, path, middlewares.join(','), handler));
    });

    // Load the router onto the path prefix
    app.use(prefix, router);
    debug(sprintf('%s router: loaded onto path %s ', definition, prefix));
  });
  cb(null, app);
};

//-------------------- END UTILITY METHODS -------------------

//-------------------- BEGIN MODULE EXPORT -------------------
module.exports = function(app, options) {
  var options = options || {};
  options.dirs = options.dirs || {};

  options.dirs.routes = options.dirs.routes || path.join(process.cwd(), 'routes');
  options.dirs.middleware = options.dirs.middleware || path.join(process.cwd(), 'middleware');
  options.dirs.handlers = options.dirs.handlers || path.join(process.cwd(), 'handlers');

  options.loader = options.loader || _loader;
  options.builder = options.builder || _builder;

  routes_table = new RoutesTable(app, options);

  routes_table.runRoutesPipeline(options, function(err, results) {
    if (err) {
      console.log('RoutesPipelineError: ' + err);
      app.emit('setup-failed', err);
    }
    else {
      console.log('Routes pipeline complete');
      app.emit('setup-complete', results);
    }
  });

  return app;
};
//--------------------- END MODULE EXPORT --------------------