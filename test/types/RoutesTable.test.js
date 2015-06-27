var assert = require('assert');
var sinon = require('sinon');
var path = require('path');
var RoutesTable = require('../../lib/types/RoutesTable');

describe('RoutesTable', function () {
  var app, options;

  beforeEach(function() {
    app = function() {};
    options = {};
    options.loader = function() {};
    options.builder = function() {};
    options.dirs = {};
    options.dirs.routes = path.join('lib', 'data', 'routes');
    options.dirs.middleware = path.join('lib', 'data', 'middleware');
    options.dirs.handlers = path.join('lib', 'data', 'handlers');
  });

  afterEach(function() {
    delete app;
    delete options;
  });

  it('should return an object with builder functions', function () {
    var routes_table = new RoutesTable(app, options);
    assert.equal(typeof routes_table, 'object');
    assert.equal(typeof routes_table.app, 'function');
    assert.equal(typeof routes_table.loader, 'function');
    assert.equal(typeof routes_table.builder, 'function');
  });

  it('should error if args are wrong', function () {
    try {
      var routes_table = new RoutesTable('', options);
    } catch(err) {
      assert.equal(err.name, 'AssertionError');
      assert.equal(err.message, 'app must be a function');
    }

    try {
      options.loader = '';
      var routes_table = new RoutesTable(app, options);
    } catch(err) {
      assert.equal(err.name, 'AssertionError');
      assert.equal(err.message, 'options.loader must be a function');
    }

    options.loader = function() {};

    try {
      options.builder = '';
      var routes_table = new RoutesTable(app, options);
    } catch(err) {
      assert.equal(err.name, 'AssertionError');
      assert.equal(err.message, 'options.builder must be a function');
    }
  });

  it('should run routes pipeline', function(done) {
    var mock_map = { map: 'bogusmap' };
    options.loader = function(options, cb) {
      cb(null, mock_map);
    };
    options.builder = function(app, map, cb) {
      cb(null, map);
    };
    var spy1 = sinon.spy(options, 'loader');
    var spy2 = sinon.spy(options, 'builder');

    var routes_table = new RoutesTable(app, options);
    routes_table.runRoutesPipeline(options, function(err, results) {
      assert.equal(spy1.calledOnce, true);
      assert.equal(spy2.calledOnce, true);
      assert.equal(results[0], mock_map);
      assert.equal(results[1], mock_map);
      done();
    });
  });

  it('should resolve handler function', function() {
    var routes_table = new RoutesTable(app, options);
    routes_table.map = {
      handlers: {
        homepage: {
          mainPage: function() {}
        }
      }
    };
    var fn = routes_table.resolveHandlerFunction('homepage.mainPage');
    assert.equal(typeof fn, 'function');
  });

  it('should return false when resolving non existent handler', function() {
    var routes_table = new RoutesTable(app, options);
    routes_table.map = {
      handlers: {
        homepage: {
          mainPage: function() {}
        }
      }
    };
    var fn = routes_table.resolveHandlerFunction('bogus.function');
    assert.equal(fn, false);
  });

  it('should resolve array of middleware functions', function() {
    var routes_table = new RoutesTable(app, options);
    routes_table.map = {
      middleware: {
        middleware: {
          middleware1: function() {},
          middleware2: function() {}
        }
      }
    };
    var middleware = ['middleware.middleware1', 'middleware.middleware2'];
    var middleware_fns = routes_table.resolveMiddlewareFunctions(middleware);
    middleware_fns.forEach(function(fn) {
      assert.equal(typeof fn, 'function');
    });
  });

  it('return false when resolving non existent middleware', function() {
    var routes_table = new RoutesTable(app, options);
    routes_table.map = {
      middleware: {
        middleware: {
          middleware1: function() {},
          middleware2: function() {}
        }
      }
    };
    var middleware = ['bogus.function1', 'bogus.function2'];
    var middleware_fns = routes_table.resolveMiddlewareFunctions(middleware);
    assert.equal(middleware_fns, false);
  });
});