"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /* eslint dot-notation: 0 */


var _meteor = require("meteor/meteor");

var _practicalmeteorChai = require("meteor/practicalmeteor:chai");

var _practicalmeteorSinon = require("meteor/practicalmeteor:sinon");

var _alanningRoles = require("meteor/alanning:roles");

var _shops = require("/server/imports/fixtures/shops");

var _api = require("/server/api");

var _fixtures = require("/server/imports/fixtures");

var _fixtures2 = _interopRequireDefault(_fixtures);

require("./members");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _fixtures2.default)();

var shopId = (0, _shops.getShop)()._id;

describe("Account Publications", function () {
  var sandbox = void 0;
  beforeEach(function () {
    // reset
    _meteor.Meteor.users.remove({});
    sandbox = _practicalmeteorSinon.sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("ShopMembers", function () {
    it("should let an admin fetch userIds", function () {
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shopId;
      });
      sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
        return true;
      });
      var publication = _meteor.Meteor.server.publish_handlers["ShopMembers"];
      var user = Factory.create("user");
      var thisContext = {
        userId: user._id
      };
      var cursor = publication.apply(thisContext);
      // verify
      data = cursor.fetch()[0];
      (0, _practicalmeteorChai.expect)(data._id).to.equal(user._id);
    });

    it("should not let a regular user fetch userIds", function () {
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shopId;
      });
      sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
        return false;
      });
      var thisContext = {
        userId: "notAdminUser",
        ready: function ready() {
          return "ready";
        }
      };
      var publication = _meteor.Meteor.server.publish_handlers["ShopMembers"];
      var cursor = publication.apply(thisContext);
      (0, _practicalmeteorChai.expect)(cursor).to.equal("ready");
    });

    it("should not overpublish user data to admins", function () {
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shopId;
      });
      sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
        return true;
      });
      var user = Factory.create("user");
      Factory.create("registeredUser");
      var thisContext = {
        userId: user._id,
        ready: function ready() {
          return "ready";
        }
      };
      var publication = _meteor.Meteor.server.publish_handlers["ShopMembers"];
      var cursor = publication.apply(thisContext);
      // verify
      data = cursor.fetch();
      // we expect services will be clean object
      (0, _practicalmeteorChai.expect)(data.some(function (_user) {
        // we expect two users. First will be without services, second with
        // clean services object
        return _typeof(_user.services) === "object" && _.isEqual(_user.services, {});
      })).to.be.true;
    });
  });
});