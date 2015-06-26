// Module: create-express-routes.js
//
// Routes build file: Creates Express.js routes from a supplied routes map
//
// (1) SCOPE VARIABLES, (2) UTILITY METHODS, (3) MODULE EXPORTS

//---------------- BEGIN MODULE SCOPE VARIABLES --------------
var
  debug   = require('debug')('routes-builder:routes-build'),
  express = require('express'),
  sprintf = require('sprintf-js').sprintf,

  _getFunctionReference,
  _getDescendantProp,
  _getHandlerFunction,
  _getMiddlewareFunctions,

  app = 'undefined',
  map = 'undefined',
  cb = 'undefined';
//---------------- END MODULE SCOPE VARIABLES ----------------

//------------------- BEGIN UTILITY METHODS ------------------
_getFunctionReference = function (fn) {
  if (typeof fn === 'function') { return (fn.name === '') ? 'fn' : fn.name; }
  return false;
};

_getDescendantProp = function (obj, desc) {
  var arr = desc.split('.');
  while (arr.length && (obj = obj[arr.shift()]));
  if (obj === undefined) {
    console.log('Warning: %s does not exist', desc);
  }
  return obj;
};

_getHandlerFunction = function (handler_name) {
  var ret, error;

  if (typeof handler_name === 'string') {
    ret = _getDescendantProp(map.handlersDefMap, handler_name);
    if (ret) {
      ret.reference = handler_name;
    } else {
      error = true;
    }
  }

  if (error) ret = false;
  return ret;
};

_getMiddlewareFunctions = function (middlewares) {
  var
    ret = [],
    error = false;

  if (middlewares instanceof Array) {
    middlewares.forEach(function(middleware) {
      var item;
      if (typeof middleware === 'string') {
        item = _getDescendantProp(map.middlewareDefMap, middleware);
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
//-------------------- END UTILITY METHODS -------------------

//-------------------- BEGIN MODULE EXPORT -------------------
module.exports = function(app_object, routes_map, cb) {
  app = app_object;
  map = routes_map;
  cb = cb || function(){};

  // Iterate over the route definition files
  Object.keys(map.routesDefMap).forEach(function(definition) {
    var prefix                 = map.routesDefMap[definition].prefix || '/';
    var default_middleware     = map.routesDefMap[definition].default_middleware;
    var routes                 = map.routesDefMap[definition].routes;
    var default_middleware_fns = _getMiddlewareFunctions(default_middleware);
    var router                 = express.Router();

    debug(sprintf('%s router: created', definition));

    // Add default middleware to the router
    if (default_middleware_fns) {
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

      middleware_fns = _getMiddlewareFunctions(middlewares);
      handler_fn = _getHandlerFunction(handler);

      // Add the route to the router
      router[method](path, middleware_fns, handler_fn);
      debug(sprintf('%s router: added route: %s %s -> %s -> %s', definition, method, path, middlewares.join(','), handler));
    });

    // Load the router onto the path prefix
    app.use(prefix, router);
    debug(sprintf('%s router: loaded onto path %s ', definition, prefix));
  });
  cb(app);
};
//--------------------- END MODULE EXPORT --------------------