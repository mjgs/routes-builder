var assert = require('assert');
var sinon = require('sinon');
var express = require('express');
var request = require('supertest');

describe('#index()', function() {

  describe('app', function () {
    it('should be callable', function () {
      var routes_builder = require('../index');
      assert.equal( typeof routes_builder,'function');
    });
    it('should return an app object', function () {
      var routes_builder = require('../index');
      var app = routes_builder(express());
      assert.equal( typeof app, 'function');
    });
    it('should log RoutesDefinitionError when folders do not exist', function (done) {
      var routes_builder = require('../index');
      var spy = sinon.spy(console, "log");
      var app = routes_builder(express());
      app.on('setup-failed', function () {
        assert.equal(spy.callCount, 2);
        assert.equal(spy.args[1][0].indexOf('RoutesDefinitionError'), 0);
        done();
      });
    });
    it('should 404 without routes', function (done) {
      var routes_builder = require('../index');
      var app = routes_builder(express());
      request(app)
        .get('/')
        .expect(404, function () {
          done();
        });
    });
  });
});