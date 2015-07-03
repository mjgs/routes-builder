var assert = require('assert');
var express = require('express');
var request = require('supertest');
var path = require('path');
var logger = require('morgan');
var ejs_locals = require('ejs-locals');
var rewire = require('rewire');

describe('#index()', function() {
  var app, routes_builder, options = {};
  beforeEach(function() {
    routes_builder = rewire('../index');
    app = express();
    var base_path = path.join(process.cwd(), 'lib', 'test-data');
    app.use(logger('dev'));
    app.set('views', path.join(base_path, 'views'));
    app.set('view engine', 'ejs');
    app.engine('ejs', ejs_locals);
    options.dirs = {};
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
    var RoutesTableMock = function() {};
    RoutesTableMock.prototype.runRoutesPipeline = function(options, cb) {
      cb(new Error('This is the setup failed error'));
    };
    var revert = routes_builder.__set__('RoutesTable', RoutesTableMock);
    app.on('setup-failed', function(err) {
      assert.equal(err.message, 'This is the setup failed error');
      revert();
      done();
    });
    app = routes_builder(app, options);
  });
  it('should cause app to emit setup-complete event', function (done) {
    var RoutesTableMock = function() {};
    RoutesTableMock.prototype.runRoutesPipeline = function(options, cb) {
      cb(null, { answer: 42 });
    };
    var revert = routes_builder.__set__('RoutesTable', RoutesTableMock);
    app.on('setup-complete', function(results) {
      assert.equal(results.answer, 42);
      revert();
      done();
    });
    app = routes_builder(app, options);
  });
  it('should 404 on non existent route', function (done) {
    options = {
      dirs: {
        routes: {},
        middleware: {},
        handlers: {}
      }
    };
    app.on('setup-complete', function () {
      request(app)
        .get('/routedoesnotexist')
        .expect(404, done);
    });
    app = routes_builder(app, options);
  });
  it('should load the route table in development mode', function (done) {
    options = {
      dirs: {
        routes: {},
        middleware: {},
        handlers: {}
      }
    };
    process.env.NODE_ENV = 'development';
    app = routes_builder(app, options);
    app.on('setup-complete', function () {
      request(app)
        .get('/routes-table')
        .expect(200, done);
    });
  });
});