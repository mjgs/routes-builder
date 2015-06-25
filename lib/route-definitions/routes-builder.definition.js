// Module: routes-builder.definition.js
//
// Route definition file: Defines routes using the routes-builder setup scheme:
//
// routes folder     - Files containing javascript objects that defines routes
// middleware folder - Files containing javascript objects that define middleware functions
// handlers folder   - Files containing javascript objects that define route handler functions
//
// Upon success exits by calling the route-build callback supplied passing in the routes map
// which is a javascript object
//
// Upon failure throws an Error
//
// (1) SCOPE VARIABLES, (2) MODULE EXPORTS

//--------------- BEGIN MODULE SCOPE VARIABLES ---------------
var
  debug        = require('debug')('routes-builder:routes-definition'),
  loader       = require('../loader'),
  routes_table = require('../routes-table'),
  path         = require('path' );
//---------------- END MODULE SCOPE VARIABLES ----------------

//------------------- BEGIN MODULE EXPORT --------------------
module.exports = function(options, cb) {
  var options = options || {};
  if (!cb && typeof options === 'function') var cb = options;

  debug('loading routes map');

  var routes, middleware, handlers;
  if (typeof options.routes === 'object') routes = options.routes;
  if (typeof options.routes === 'string') routes = path.join(process.cwd(), options.routes);
  if (typeof options.routes === 'undefined') routes = path.join(process.cwd(), 'routes');

  if (typeof options.middleware === 'object') middleware = options.middleware;
  if (typeof options.middleware === 'string') middleware = options.middleware;
  if (typeof options.middleware === 'undefined') middleware = path.join(process.cwd(), 'middleware');

  if (typeof options.handlers === 'object') handlers = options.handlers;
  if (typeof options.handlers === 'string') handlers = options.handlers;
  if (typeof options.handlers === 'undefined') handlers = path.join(process.cwd(), 'handlers');

  var folders = {
    routes     : routes,
    middleware : middleware,
    handlers   : handlers
  };
  var routes_map;

  // Load the javascript objects
  loader.load(folders, function(err, loaded_map) {
    if (err) { return cb(err, null); }
    routes_map = loaded_map;
    if (process.env.NODE_ENV === 'development') {
      routes_map = routes_table.addRouteTable(routes_map, '/', '/routes-table');
    }
    debug('routes map loaded');
    cb(null, routes_map);
  });
};
//-------------------- END MODULE EXPORT ---------------------