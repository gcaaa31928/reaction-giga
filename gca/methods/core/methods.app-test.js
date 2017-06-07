"use strict";

var _meteor = require("meteor/meteor");

var _collections = require("/lib/collections");

var _practicalmeteorChai = require("meteor/practicalmeteor:chai");

var _practicalmeteorSinon = require("meteor/practicalmeteor:sinon");

var _api = require("/server/api");

describe("Server/Core", function () {
  var sandbox = void 0;

  beforeEach(function () {
    sandbox = _practicalmeteorSinon.sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("shop/removeHeaderTag", function () {
    beforeEach(function () {
      return _collections.Tags.remove({});
    });

    it("should throw 403 error by non admin", function (done) {
      var tagUpdateSpy = sandbox.spy(_collections.Tags, "update");
      var tagRemoveSpy = sandbox.spy(_collections.Tags, "remove");
      var tag = Factory.create("tag");
      var currentTag = Factory.create("tag");
      function removeTagFunc() {
        return _meteor.Meteor.call("shop/removeHeaderTag", tag._id, currentTag._id);
      }
      (0, _practicalmeteorChai.expect)(removeTagFunc).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(tagUpdateSpy).to.not.have.been.called;
      (0, _practicalmeteorChai.expect)(tagRemoveSpy).to.not.have.been.called;
      return done();
    });

    it("should remove header tag by admin", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });

      var tag = Factory.create("tag");
      var currentTag = Factory.create("tag");
      (0, _practicalmeteorChai.expect)(_collections.Tags.find().count()).to.equal(2);
      _meteor.Meteor.call("shop/removeHeaderTag", tag._id, currentTag._id);
      (0, _practicalmeteorChai.expect)(_collections.Tags.find().count()).to.equal(1);
      return done();
    });
  });

  describe("shop/createTag", function () {
    beforeEach(function () {
      _collections.Tags.remove({});
    });

    it("should throw 403 error by non admin", function () {
      sandbox.stub(Roles, "userIsInRole", function () {
        return false;
      });
      sandbox.spy(_collections.Tags, "insert");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("shop/createTag", "testTag", true);
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(_collections.Tags.insert).not.to.have.been.called;
    });

    it("should create new tag", function (done) {
      sandbox.stub(Roles, "userIsInRole", function () {
        return true;
      });
      sandbox.spy(_collections.Tags, "insert");
      (0, _practicalmeteorChai.expect)(_meteor.Meteor.call("shop/createTag", "testTag", true)).to.be.a("string");
      (0, _practicalmeteorChai.expect)(_collections.Tags.insert).to.have.been.called;
      return done();
    });
  });

  describe("shop/updateHeaderTags", function () {
    beforeEach(function () {
      _collections.Shops.remove({});
      return _collections.Tags.remove({});
    });

    it("should throw 403 error by non admin", function (done) {
      sandbox.spy(_collections.Tags, "update");
      var tag = Factory.create("tag");
      function updateTagFunc() {
        return _meteor.Meteor.call("shop/updateHeaderTags", tag._id);
      }
      (0, _practicalmeteorChai.expect)(updateTagFunc).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(_collections.Tags.update).not.to.have.been.called;
      return done();
    });

    it("should insert new header tag with 1 argument by admin", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var tagCount = _collections.Tags.find().count();
      Factory.create("shop"); // Create shop so that ReactionCore.getShopId() doesn't fail
      _meteor.Meteor.call("shop/updateHeaderTags", "new tag");
      (0, _practicalmeteorChai.expect)(_collections.Tags.find().count()).to.equal(tagCount + 1);
      var tag = _collections.Tags.find().fetch()[0];
      (0, _practicalmeteorChai.expect)(tag.name).to.equal("new tag");
      (0, _practicalmeteorChai.expect)(tag.slug).to.equal("new-tag");
      return done();
    });

    it("should update existing header tag with 2 arguments by admin", function (done) {
      var tag = void 0;
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      tag = Factory.create("tag");
      _meteor.Meteor.call("shop/updateHeaderTags", "updated tag", tag._id);
      (0, _practicalmeteorChai.expect)(_collections.Tags.find().count()).to.equal(1);
      tag = _collections.Tags.find().fetch()[0];
      (0, _practicalmeteorChai.expect)(tag.name).to.equal("updated tag");
      (0, _practicalmeteorChai.expect)(tag.slug).to.equal("updated-tag");
      return done();
    });
  });
});