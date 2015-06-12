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
  loader       = require('../loader'),
  routes_table = require('../routes-table'),
  path         = require('path' );
//---------------- END MODULE SCOPE VARIABLES ----------------

//------------------- BEGIN MODULE EXPORT --------------------
module.exports = function(cb) {
  var
    folders = {
      routes     : path.join(process.cwd(), 'routes'),
      middleware : path.join(process.cwd(), 'middleware'),
      handlers   : path.join(process.cwd(), 'handlers')
    },
    routes_map;

  // Load the javascript objects
  loader.load(folders, function(err, loaded_map) {
    if (err) { return cb(err, null); }
    routes_map = loaded_map;
    if (process.env.NODE_ENV === 'development') {
      routes_map = routes_table.addRouteTable(routes_map, '/', '/routes-table');
    }
    cb(null, routes_map);
  });
};
//-------------------- END MODULE EXPORT ---------------------