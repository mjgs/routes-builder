var async = require('async');
var assert = require('assert');
var mu = require('mu2');
var path = require('path');

module.exports = RoutesTable;

var self;

function RoutesTable(app, options) {
  self = this;
  self.app = app;
  self.loader = options.loader;
  self.builder = options.builder;
  self.routes_dir = options.routes_dir;
  self.middleware_dir = options.middleware_dir;
  self.handlers_dir = options.handlers_dir;
  self.routes = [];
  self.map = 'undefined';
  self.url = 'undefined';
  self.prefix = 'undefined';
  self.hostname = 'undefined';
  self.port = 'undefined';

  assert.equal(typeof self.app, 'function', 'app must be a function');
  assert.equal(typeof self.loader, 'function', 'options.loader must be a function');
  assert.equal(typeof self.builder, 'function', 'options.builder must be a function');
}

RoutesTable.prototype.runRoutesPipeline = function(options, cb) {
  async.series([
    function(callback) {
      self.loader(options, function(err, loaded_map) {
        if (err) callback(err, null);
        self.map = loaded_map;
        callback(null, self.map);
      });
    },
    function(callback) {
      if (process.env.NODE_ENV === 'development') {
        self.map = self.addRoutesTableViewer('/', '/routes-table');
      }
      callback(null, self.map);
    },
    function(callback) {
      self.builder(self.app, self.map, function(err, result) {
        if (err) callback(err, null);
        callback(null, result);
      });
    }
  ], function(err, results) {
    if (err) {
      return cb(err, null);
    }
    else {
      return cb(null, results);
    }
  });
};

var _getDescendantProp = function (obj, desc) {
  var arr = desc.split('.');
  while (arr.length && (obj = obj[arr.shift()]));
  if (obj === undefined) {
    console.log('Warning: %s does not exist', desc);
  }
  return obj;
};

RoutesTable.prototype.resolveHandlerFunction = function (handler_name) {
  var ret, error;

  if (typeof handler_name === 'string') {
    ret = _getDescendantProp(self.map.handlers, handler_name);
    if (ret) {
      ret.reference = handler_name;
    } else {
      error = true;
    }
  }

  if (error) ret = false;
  return ret;
};

RoutesTable.prototype.resolveMiddlewareFunctions = function (middlewares) {
  var
    ret = [],
    error = false;

  if (middlewares instanceof Array) {
    middlewares.forEach(function(middleware) {
      var item;
      if (typeof middleware === 'string') {
        item = _getDescendantProp(self.map.middleware, middleware);
        if (item) {
          item.reference = middleware;
          ret.push(item);
        } else {
          error = true;
        }
      }
      else {
        ret.push(middleware);
      }
    });
  }
  else {
    ret = middlewares;
  }

  if (error) ret = false;
  return ret;
};

RoutesTable.prototype.addRoutesTableViewer = function (url, prefix, hostname, port) {
  if (typeof self.map.handlers['#routes-table#'] !== 'undefined') {
    console.log("Warning: '#routes-table#.js' is a reserved handler file name");
  }
  if (typeof self.map.routes['#routes-table#'] !== 'undefined') {
    console.log("Warning: '#routes-table#.js' is a reserved routes file name");
  }

  self.url = url;
  self.prefix = prefix;
  self.hostname = hostname;
  self.port = port;

  self.map.handlers['#routes-table#'] = {
    _generateRouteTable : _generateRouteTable
  };

  self.map.routes['#routes-table#'] = {
    prefix: self.prefix,
    routes: [
      [ 'get', self.url, [], '#routes-table#._generateRouteTable' ]
    ]
  };
  return self.map;
};

var _generateRouteTable = function (req, res) {
  var route_groups = [];

  Object.keys(self.map.routes).forEach(function(group) {
    route_groups.push({
      group: group,
      definition: self.map.routes[group]
    });
  });

  if ((req.headers['Content-Type'] === 'application/json') ||
    (req.headers['Accept'] === 'application/json') ||
    (req.headers['X-Requested-With'] === 'XMLHttpRequest')) {
    return res.json({ routes_map: route_groups });
  }
  else {
    var routes = [];
    route_groups.forEach(function(route_group) {
      var definition = route_group.definition;
      var group_name = route_group.group;
      var prefix = definition.prefix;
      var default_middleware = definition.default_middleware || '';

      route_group.definition.routes.forEach(function(route) {
        var middleware = route[2].join(',');
        if (default_middleware) {
          middleware = default_middleware.concat(route[2] ).join(',');
        }
        var route_path;
        (prefix) ? route_path = prefix + route[1] : route_path = route[1];
        if (prefix === '/') {
          route_path = route[1];
        }
        routes.push({
          group: group_name,
          method: route[0],
          path: route_path,
          middleware: middleware,
          handler: route[3]
        });
      });
    });

    mu.root = path.join(__dirname, '..', 'html');
    var stream = mu.compileAndRender( 'routes-table.html', {
      routes : routes,
      host   : self.hostname || 'localhost',
      port   : self.port || 3000
    });
    stream.pipe(res);
  }
};