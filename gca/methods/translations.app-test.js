"use strict";

var _meteor = require("meteor/meteor");

var _alanningRoles = require("meteor/alanning:roles");

var _collections = require("/lib/collections");

var _api = require("/server/api");

var _practicalmeteorChai = require("meteor/practicalmeteor:chai");

var _practicalmeteorSinon = require("meteor/practicalmeteor:sinon");

var _fixtures = require("/server/imports/fixtures");

var _fixtures2 = _interopRequireDefault(_fixtures);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _fixtures2.default)();

describe("i18n methods", function () {
  var sandbox = void 0;

  beforeEach(function () {
    sandbox = _practicalmeteorSinon.sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("i18n/flushTranslations", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
        return false;
      });
      var removeTranslationSpy = sandbox.spy(_collections.Translations, "remove");
      var importTranslationSpy = sandbox.spy(_api.Reaction.Import, "translation");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("i18n/flushTranslations");
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(removeTranslationSpy).to.not.have.been.called;
      (0, _practicalmeteorChai.expect)(importTranslationSpy).to.not.have.been.called;
    });

    it("should remove and load translations back by admin", function () {
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return "0123456789";
      });
      sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
        return true;
      });
      var removeTranslationSpy = sandbox.spy(_collections.Translations, "remove");
      Factory.create("shop");
      _meteor.Meteor.call("i18n/flushTranslations");
      (0, _practicalmeteorChai.expect)(removeTranslationSpy).to.have.been.called;
      // expect(ReactionImport.process).toHaveBeenCalled();
    });
  });
});