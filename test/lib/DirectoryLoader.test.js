var assert = require('assert');
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

  it.skip('should load a directory of objects', function () {
    assert.equal(true, false);
  });

  it.skip('should load a directory map of objects', function () {
    assert.equal(true, false);
  });
});