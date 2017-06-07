"use strict";

var _meteor = require("meteor/meteor");

var _practicalmeteorChai = require("meteor/practicalmeteor:chai");

var _practicalmeteorSinon = require("meteor/practicalmeteor:sinon");

var _shops = require("/server/imports/fixtures/shops");

var _api = require("/server/api");

var _collections = require("/lib/collections");

var Collections = _interopRequireWildcard(_collections);

var _fixtures = require("/server/imports/fixtures");

var _fixtures2 = _interopRequireDefault(_fixtures);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

(0, _fixtures2.default)(); /* eslint dot-notation: 0 */


describe("Cart Publication", function () {
  var shop = (0, _shops.getShop)();
  var sandbox = void 0;

  beforeEach(function () {
    sandbox = _practicalmeteorSinon.sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("Cart", function () {
    // for this: "should return only one cart in cursor" test we need to avoid
    // user carts merging. We need registered users for here.
    var user = Factory.create("registeredUser");
    var userId = user._id;
    var sessionId = _api.Reaction.sessionId = Random.id();
    var thisContext = {
      userId: userId
    };

    beforeEach(function () {
      Collections.Cart.direct.remove({});
    });

    afterEach(function () {
      Collections.Cart.direct.remove({});
    });

    it("should return a cart cursor", function () {
      var account = Factory.create("account");
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return account.userId;
      });
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shop._id;
      });
      Collections.Cart.insert({
        sessionId: sessionId,
        userId: userId,
        shopId: shop._id
      });
      var cartPub = _meteor.Meteor.server.publish_handlers["Cart"];
      var cursor = cartPub.apply(thisContext, [sessionId]);
      var data = cursor.fetch()[0];
      (0, _practicalmeteorChai.expect)(data.userId).to.equal(userId);
    });

    it("should return only one cart in cursor", function () {
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shop._id;
      });
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return user._id;
      });
      var user2 = Factory.create("registeredUser");
      Collections.Cart.insert({
        sessionId: sessionId,
        userId: userId,
        shopId: shop._id
      });
      Collections.Cart.insert({
        sessionId: sessionId,
        userId: user2._id,
        shopId: shop._id
      });
      // Meteor.call("cart/createCart", user2._id, sessionId);
      (0, _practicalmeteorChai.expect)(Collections.Cart.find().count()).to.equal(2); // ensure we've added 2 carts
      var cartPub = _meteor.Meteor.server.publish_handlers["Cart"];
      var cursor = cartPub.apply(thisContext, [sessionId]);
      var data = cursor.fetch();
      (0, _practicalmeteorChai.expect)(data).to.be.an("array");
      (0, _practicalmeteorChai.expect)(data.length).to.equal(1);
      (0, _practicalmeteorChai.expect)(data[0].userId).to.equal(userId);
    });
  });
});