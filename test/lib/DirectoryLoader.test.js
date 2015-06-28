var assert = require('assert');
var path = require('path');
var DirectoryLoader = require('../../lib/DirectoryLoader');

describe('DirectoryLoader', function() {
  it('should return a function', function () {
    assert.equal( typeof DirectoryLoader, 'function');
  });

  it('should instantiate a new DirectoryLoader object with some functions', function () {
    var loader = new DirectoryLoader();
    assert.equal(typeof loader.loadDirectory, 'function');
    assert.equal(typeof loader.loadDirectoryMap, 'function');
  });

  it('should load a directory of objects', function () {
    var dir = path.join(__dirname, '..', '..', 'lib', 'test-data', 'routes');
    var loader = new DirectoryLoader();
    loader.loadDirectory(dir, function(err, results) {
      assert.equal(err, null);
      assert.equal(results.length, 2);
    });
  });

  it('should load a directory map of objects', function () {
    var dir_map = {
      routes    : path.join(__dirname, '..', '..', 'lib', 'test-data', 'routes'),
      middleware: path.join(__dirname, '..', '..', 'lib', 'test-data', 'middleware'),
      handlers  : path.join(__dirname, '..', '..', 'lib', 'test-data', 'handlers')
    };
    var loader = new DirectoryLoader();
    loader.loadDirectoryMap(dir_map, function(err, results) {
      assert.equal(err, null);
      assert.equal(typeof results.routes, 'object');
      assert.equal(results.routes.length, 2);
      assert.equal(typeof results.middleware, 'middleware');
      assert.equal(results.middleware.length, 1);
      assert.equal(typeof results.handlers, 'handlers');
      assert.equal(results.handlers.length, 2);
    });
  });
});