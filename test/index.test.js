var assert = require('assert');
var express = require('express');
var request = require('supertest');
var path = require('path');
var logger = require('morgan');
var ejs_locals = require('ejs-locals');

describe('#index()', function() {
  var app, routes_builder, options = {};
  beforeEach(function() {
    routes_builder = require('../index');
    app = express();
    var base_path = path.join(process.cwd(), 'lib', 'test-data');
    app.use(logger('dev'));
    app.set('views', path.join(base_path, 'views'));
    app.set('view engine', 'ejs');
    app.engine('ejs', ejs_locals);
    options.dirs = {};
    options.dirs.routes = path.join('lib', 'test-data', 'routes');
    options.dirs.middleware = path.join('lib', 'test-data', 'middleware');
    options.dirs.handlers = path.join('lib', 'test-data', 'handlers');
  });
  afterEach(function() {
    delete routes_builder;
    delete app;
    delete options;
    delete base_path;
  });
  it('should be callable', function () {
    assert.equal(typeof routes_builder,'function');
  });
  it('should return an app object', function () {
    app = routes_builder(app);
    assert.equal(typeof app, 'function');
  });
  it('should cause app to emit setup-failed event', function (done) {
    app = routes_builder(express());
    app.on('setup-failed', function (err) {
      assert.equal(err.code, 'ENOENT');
      done();
    });
  });
  it('should cause app to emit setup-complete event', function (done) {
    app = routes_builder(app, options);
    app.on('setup-complete', function(results) {
      assert.equal(results.length, 3);
      assert.equal(typeof results[0].routes, 'object');
      assert.equal(typeof results[0].middleware, 'object');
      assert.equal(typeof results[0].handlers, 'object');
      assert.equal(typeof results[1], 'object');
      assert.equal(typeof results[2], 'function');
      request(results[2])
        .get('/')
        .expect(200, done);
    });
  });
  it('should 404 on non existent route', function (done) {
    app = routes_builder(app, options);
    app.on('setup-complete', function () {
      request(app)
        .get('/routedoesnotexist')
        .expect(404, done);
    });
  });

});