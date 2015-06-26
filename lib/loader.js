// Module: loader.js
//
// Loads javascript objects and functions from directories, for example
// route handlers, route middleware and route definitions
//
// (1) SCOPE VARIABLES, (2) UTILITY METHODS, (3) PUBLIC METHODS,
// (4) MODULE EXPORTS

//---------------- BEGIN MODULE SCOPE VARIABLES --------------
var
  debug = require('debug')('routes-builder:loader'),
  async = require('async'),
  path  = require('path'),
  readdir = require('readdir'),

  _loadDirectoryOfObjects,

  load;
//---------------- END MODULE SCOPE VARIABLES ----------------

//------------------- BEGIN UTILITY METHODS ------------------
_loadDirectoryOfObjects = function (dir, cb) {
  var
    resultsMap = {};

  if (typeof dir === 'string') {
    readdir.read(dir, ['**.js'], readdir.NON_RECURSIVE, function (err, files) {
      if (err) { return cb(err); }
      var object, file, full_path, full_path_require;

      files.forEach(function (filename) {
        file = filename.substring(0, filename.length - 3);
        full_path = path.join(dir, filename);
        full_path_require = path.join(dir, file);

        debug('require %s', full_path);

        try {
          object = require(full_path_require);
        }
        catch (err) {
          return cb(err);
        }
        resultsMap[file] = object;
      });
      cb(null, resultsMap);
    });
  }
  else if (typeof dir === 'object') {
    cb(null, dir);
  }
};
//-------------------- END UTILITY METHODS -------------------

//------------------- BEGIN PUBLIC METHODS -------------------
load = function (dir_map, cb) {
  var
    resultsMaps = {},
    ctr = 0,
    keys;

  // Check the passed parameters
  if (!cb || typeof cb !== 'function') { throw new Error('LoaderError: second parameter must be a callback function'); }
  if (typeof dir_map !== 'object') { throw new Error('LoaderError: first parameter must be an object'); }

  debug("Loading: %s", Object.keys(dir_map).join(', '));
  debug('dir_map: %s', JSON.stringify(dir_map, null, 2));

  // Add a way to get a list of object values
  Object.prototype.values = function (obj) {
    var values = [];

    keys = Object.keys(obj).sort();
    keys.forEach(function (key) {
      values.push(obj[key]);
    });
    return values;
  };

  async.map(Object.values(dir_map), _loadDirectoryOfObjects, function (err, results) {
    if (err) { return cb(err); }

    keys = Object.keys(dir_map).sort();
    keys.forEach(function(dir_label) {
      resultsMaps[dir_label + "DefMap"] = results[ctr];
      ctr++;
    });

    debug("All objects loaded");
    cb(null, resultsMaps);
  });
};
//------------------- END PUBLIC METHODS ---------------------

//------------------- BEGIN MODULE EXPORTS -------------------
module.exports = {
  load : load
};
//-------------------- END MODULE EXPORTS --------------------