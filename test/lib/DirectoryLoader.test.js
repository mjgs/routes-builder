var assert = require('assert');
var path = require('path');
var rewire = require('rewire');
var DirectoryLoader = rewire('../../lib/DirectoryLoader');

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
    var readdirMock = {
      read: function(dir, glob, options, cb) {
        cb(null, [
          'file1.js',
          'file2.js',
          'file3.js',
          'file4.js',
          'file5.js'
        ]);
      }
    };
    DirectoryLoader.__set__('readdir', readdirMock);
    var requireMock = function (name) {
      if ((name.indexOf('file1.js')) ||
          (name.indexOf('file2.js')) ||
          (name.indexOf('file3.js')) ||
          (name.indexOf('file4.js')) ||
          (name.indexOf('file5.js'))) {
        return {};
      }
      else {
        require(name);
      }
    };
    DirectoryLoader.__set__('require', requireMock);

    var dir_map = {
      routes    : '/bogus/path/1',
      middleware: '/bogus/path/2',
      handlers  : '/bogus/path/3'
    };
    var loader = new DirectoryLoader();
    loader.loadDirectoryMap(dir_map, function(err, results) {
      assert.equal(err, null);
      assert.deepEqual(results, {
        routes: { file1: {}, file2: {}, file3: {}, file4: {}, file5: {} },
        middleware: { file1: {}, file2: {}, file3: {}, file4: {}, file5: {} },
        handlers: { file1: {}, file2: {}, file3: {}, file4: {}, file5: {} }
      });
    });
  });
});