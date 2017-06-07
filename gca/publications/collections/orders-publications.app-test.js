"use strict";

var _meteor = require("meteor/meteor");

var _practicalmeteorChai = require("meteor/practicalmeteor:chai");

var _practicalmeteorSinon = require("meteor/practicalmeteor:sinon");

var _alanningRoles = require("meteor/alanning:roles");

var _shops = require("/server/imports/fixtures/shops");

var _api = require("/server/api");

var _collections = require("/lib/collections");

var Collections = _interopRequireWildcard(_collections);

var _fixtures = require("/server/imports/fixtures");

var _fixtures2 = _interopRequireDefault(_fixtures);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/* eslint dot-notation: 0 */
(0, _fixtures2.default)();

describe("Order Publication", function () {
  var shop = (0, _shops.getShop)();
  var sandbox = void 0;
  var productRemoveStub = void 0;
  var productInsertStub = void 0;

  beforeEach(function () {
    sandbox = _practicalmeteorSinon.sinon.sandbox.create();
    Collections.Orders.direct.remove();
  });

  afterEach(function () {
    sandbox.restore();
    Collections.Orders.direct.remove();
  });

  before(function () {
    // We are mocking inventory hooks, because we don't need them here, but
    // if you want to do a real stress test, you could try to comment out
    // this spyOn lines. This is needed only for ./reaction test. In one
    // package test this is ignoring.
    if (Array.isArray(Collections.Products._hookAspects.remove.after) && Collections.Products._hookAspects.remove.after.length) {
      productRemoveStub = _practicalmeteorSinon.sinon.stub(Collections.Products._hookAspects.remove.after[0], "aspect");
      productInsertStub = _practicalmeteorSinon.sinon.stub(Collections.Products._hookAspects.insert.after[0], "aspect");
    }
  });

  after(function () {
    productRemoveStub.restore();
    productInsertStub.restore();
  });

  describe("Orders", function () {
    var thisContext = {
      userId: "userId",
      ready: function ready() {
        return "ready";
      }
    };

    it("should return shop orders for an admin", function () {
      sandbox.stub(Collections.Orders._hookAspects.insert.before[0], "aspect");
      sandbox.stub(Collections.Orders._hookAspects.update.before[0], "aspect");
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "inventory/register", function () {
        check(arguments, [Match.Any]);
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "inventory/sold", function () {
        check(arguments, [Match.Any]);
      });
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shop._id;
      });
      sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
        return true;
      });
      order = Factory.create("order", { status: "created" });
      var publication = _meteor.Meteor.server.publish_handlers["Orders"];
      var cursor = publication.apply(thisContext);
      var data = cursor.fetch()[0];
      (0, _practicalmeteorChai.expect)(data.shopId).to.equal(order.shopId);
    });

    it("should not return shop orders for non admin", function () {
      sandbox.stub(Collections.Orders._hookAspects.insert.before[0], "aspect");
      sandbox.stub(Collections.Orders._hookAspects.update.before[0], "aspect");
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "inventory/register", function () {
        check(arguments, [Match.Any]);
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "inventory/sold", function () {
        check(arguments, [Match.Any]);
      });
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shop._id;
      });
      sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
        return false;
      });
      order = Factory.create("order", { status: "created" });
      var publication = _meteor.Meteor.server.publish_handlers["Orders"];
      var cursor = publication.apply(thisContext);
      (0, _practicalmeteorChai.expect)(cursor.fetch().length).to.equal(0);
    });
  });
});