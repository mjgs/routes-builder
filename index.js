// Module: index.js
//
// Loads specified route-definition and route-creation functions then uses them to
// setup routes
//
// (1) SCOPE VARIABLES, (2) UTILITY METHODS, (3) MODULE EXPORTS

//---------------- BEGIN MODULE SCOPE VARIABLES --------------
var
  debug = require('debug')('routes-builder:index'),
  path  = require('path'),
  async = require('async'),

  _init,
  _load,
  _run_route_definition,
  _run_route_build,

  definitions_folder = path.join(__dirname, 'lib', 'route-definitions'),
  builds_folder = path.join(__dirname, 'lib', 'route-builds');
//---------------- END MODULE SCOPE VARIABLES ----------------

//------------------- BEGIN UTILITY METHODS ------------------
_init = function (app, route_definition, route_creation) {
  async.parallel([
      function(callback){
        // Load the route definition
        _load(definitions_folder, route_definition, function (err, fn) {
          if (err) { throw err; }
          route_definition = fn;
          callback(null, route_definition);
        });
      },
      function(callback){
        // Load the creation logic
        _load(builds_folder, route_creation, function (err, fn) {
          if (err) { throw err; }
          route_creation = fn;
          callback(null, route_creation);
        });
      }
    ],
    function(err, results) {
      if (err) { throw err; }      
      _run_route_definition = results[0];
      _run_route_build = results[1];

      // Setup the routes
      console.log('Running route-builder scripts');
      _run_route_definition(function(err, map) {
        if (err) { throw err; }
        _run_route_build(app, map);
      });
    }
  );
};

_load = function (folder, filename, cb) {
  var
    fn,
    full_path;

  if (typeof filename === 'function') { return cb(null, filename); }
  if (typeof filename !== 'string') { return cb(new Error("setup specifier must be of type string or function")); }

  full_path = path.join(folder, filename + '.js');

  try {
    console.log('Loading route-builder script: ' + full_path);
    fn = require( full_path );
  }
  catch (err) {
    return cb(err, null);
  }
  if (typeof fn !== 'function') { return cb(new Error("Loaded setup file did not export a function")); }
  cb(null, fn);
};
//-------------------- END UTILITY METHODS -------------------

//-------------------- BEGIN MODULE EXPORT -------------------
module.exports = function(app, definition, creation) {
  var
    route_definition = definition || 'routes-builder.definition',
    route_creation = creation || 'express.build';

  _init(app, route_definition, route_creation);
  return app;
};
//--------------------- END MODULE EXPORT --------------------
