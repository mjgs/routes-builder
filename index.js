// Module: index.js
//
// Loads specified route-definition and route-build functions then uses them to
// setup routes
//
// (1) SCOPE VARIABLES, (2) UTILITY METHODS, (3) MODULE EXPORTS

//---------------- BEGIN MODULE SCOPE VARIABLES --------------
var
  debug  = require('debug')('routes-builder:index'),
  path   = require('path'),
  async  = require('async'),

  _init,
  _load,
  _run_route_definition,
  _run_route_build,

  definitions_folder = path.join(__dirname, 'lib', 'route-definitions'),
  builds_folder = path.join(__dirname, 'lib', 'route-builds');
//---------------- END MODULE SCOPE VARIABLES ----------------

//------------------- BEGIN UTILITY METHODS ------------------
_init = function (app, options) {
  async.parallel([
      function(callback){
        // Load the route definition
        _load(definitions_folder, options.route_definition, function (err, fn) {
          if (err) { throw err; }
          options.route_definition = fn;
          callback(null, options.route_definition);
        });
      },
      function(callback){
        // Load the build logic
        _load(builds_folder, options.route_build, function (err, fn) {
          if (err) { throw err; }
          options.route_build = fn;
          callback(null, options.route_build);
        });
      }
    ],
    function(err, results) {
      if (err) { throw err; }      
      _run_route_definition = results[0];
      _run_route_build = results[1];

      // Setup the routes
      console.log('Running routes-definition script');
      _run_route_definition(options, function(err, map) {
        if (err) { throw err; }
        console.log('Running routes-build script');
        _run_route_build(app, map, function(app) {
          console.log('Routes building complete');
          app.emit('setup-complete');
        });
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
    debug('Loading: ' + full_path);
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
module.exports = function(app, options) {
  var options = options || {};
  options.route_definition = options.route_definition || 'routes-builder.definition';
  options.route_build = options.route_build || 'express.build';

  _init(app, options);
  return app;
};
//--------------------- END MODULE EXPORT --------------------