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


describe("cart methods", function () {
  var shop = (0, _shops.getShop)();
  var sandbox = void 0;

  beforeEach(function () {
    sandbox = _practicalmeteorSinon.sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  // Required for creating a cart
  after(function () {
    _meteor.Meteor.users.remove({});
  });

  describe("cart/removeFromCart", function () {
    beforeEach(function () {
      Collections.Cart.remove({});
    });

    it("should remove item from cart", function (done) {
      this.timeout(5000);
      var cart = Factory.create("cart");
      var cartUserId = cart.userId;
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shop._id;
      });
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return cartUserId;
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "cart/resetShipmentMethod", function () {
        check(arguments, [Match.Any]);
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "shipping/updateShipmentQuotes", function () {
        check(arguments, [Match.Any]);
      });
      var updateSpy = sandbox.spy(Collections.Cart, "update");
      var cartFromCollection = Collections.Cart.findOne(cart._id);
      var cartItemId = cartFromCollection.items[0]._id;
      _practicalmeteorChai.assert.equal(cartFromCollection.items.length, 2);
      _meteor.Meteor.call("cart/removeFromCart", cartItemId);
      _practicalmeteorChai.assert.equal(updateSpy.callCount, 1, "update should be called one time");
      _meteor.Meteor._sleepForMs(1000);
      var updatedCart = Collections.Cart.findOne(cart._id);
      _practicalmeteorChai.assert.equal(updatedCart.items.length, 1, "there should be one item left in cart");
      return done();
    });

    it("should decrease the quantity when called with a quantity", function () {
      sandbox.stub(_meteor.Meteor.server.method_handlers, "cart/resetShipmentMethod", function () {
        check(arguments, [Match.Any]);
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "shipping/updateShipmentQuotes", function () {
        check(arguments, [Match.Any]);
      });
      var cart = Factory.create("cartTwo");
      var cartUserId = cart.userId;
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shop._id;
      });
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return cartUserId;
      });
      var cartFromCollection = Collections.Cart.findOne(cart._id);
      var cartItemId = cartFromCollection.items[0]._id;
      _meteor.Meteor.call("cart/removeFromCart", cartItemId, 1);
      _meteor.Meteor._sleepForMs(500);
      var updatedCart = Collections.Cart.findOne(cart._id);
      (0, _practicalmeteorChai.expect)(updatedCart.items[0].quantity).to.equal(1);
    });

    it("should remove cart item when quantity is decresed to zero", function () {
      sandbox.stub(_meteor.Meteor.server.method_handlers, "cart/resetShipmentMethod", function () {
        check(arguments, [Match.Any]);
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "shipping/updateShipmentQuotes", function () {
        check(arguments, [Match.Any]);
      });
      var cart = Factory.create("cartOne");
      var cartUserId = cart.userId;
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shop._id;
      });
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return cartUserId;
      });
      var cartFromCollection = Collections.Cart.findOne(cart._id);
      var cartItemId = cartFromCollection.items[0]._id;
      var originalQty = cartFromCollection.items[0].quantity;
      _meteor.Meteor.call("cart/removeFromCart", cartItemId, originalQty);
      _meteor.Meteor._sleepForMs(500);
      var updatedCart = Collections.Cart.findOne(cart._id);
      (0, _practicalmeteorChai.expect)(updatedCart.items.length).to.equal(0);
    });

    it("should throw an exception when attempting to remove item from cart of another user", function (done) {
      var cart = Factory.create("cart");
      var cartItemId = "testId123";

      sandbox.stub(_meteor.Meteor, "userId", function () {
        return cart.userId;
      });

      function removeFromCartFunc() {
        return _meteor.Meteor.call("cart/removeFromCart", cartItemId);
      }
      (0, _practicalmeteorChai.expect)(removeFromCartFunc).to.throw(_meteor.Meteor.Error, /cart-item-not-found/);
      return done();
    });

    it("should throw an exception when attempting to remove non-existing item", function (done) {
      var cart = Factory.create("cart");
      var cartItemId = Random.id();
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return cart.userId;
      });

      function removeFromCartFunc() {
        return _meteor.Meteor.call("cart/removeFromCart", cartItemId);
      }
      (0, _practicalmeteorChai.expect)(removeFromCartFunc).to.throw(_meteor.Meteor.Error, /cart-item-not-found/);
      return done();
    });
  });
});