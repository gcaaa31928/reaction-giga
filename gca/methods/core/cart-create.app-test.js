"use strict";

var _meteor = require("meteor/meteor");

var _dburlesFactory = require("meteor/dburles:factory");

var _api = require("/server/api");

var _collections = require("/lib/collections");

var _practicalmeteorChai = require("meteor/practicalmeteor:chai");

var _practicalmeteorSinon = require("meteor/practicalmeteor:sinon");

var _shops = require("/server/imports/fixtures/shops");

var _products = require("/server/imports/fixtures/products");

var _fixtures = require("/server/imports/fixtures");

var _fixtures2 = _interopRequireDefault(_fixtures);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _fixtures2.default)(); /* eslint dot-notation: 0 */

describe("Add/Create cart methods", function () {
  var user = _dburlesFactory.Factory.create("user");
  var shop = (0, _shops.getShop)();
  var userId = user._id;
  var sessionId = _api.Reaction.sessionId = Random.id();
  var sandbox = void 0;
  var originals = void 0;

  before(function () {
    originals = {
      mergeCart: _meteor.Meteor.server.method_handlers["cart/mergeCart"],
      createCart: _meteor.Meteor.server.method_handlers["cart/createCart"],
      copyCartToOrder: _meteor.Meteor.server.method_handlers["cart/copyCartToOrder"],
      addToCart: _meteor.Meteor.server.method_handlers["cart/addToCart"],
      setShipmentAddress: _meteor.Meteor.server.method_handlers["cart/setShipmentAddress"],
      setPaymentAddress: _meteor.Meteor.server.method_handlers["cart/setPaymentAddress"]
    };
  });

  beforeEach(function () {
    sandbox = _practicalmeteorSinon.sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  after(function () {
    _meteor.Meteor.users.remove({});
  });

  afterEach(function () {
    _meteor.Meteor.users.remove({});
  });

  function spyOnMethod(method, id) {
    return sandbox.stub(_meteor.Meteor.server.method_handlers, "cart/" + method, function () {
      check(arguments, [Match.Any]); // to prevent audit_arguments from complaining
      this.userId = id;
      return originals[method].apply(this, arguments);
    });
  }

  describe("cart/createCart", function () {
    it.skip("should create a test cart", function () {
      // This test needs to be skipped until we can properly stub out the shopIdAutoValue function
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shop._id;
      });
      var cartInsertSpy = sandbox.spy(_collections.Cart, "insert");
      var cartId = _meteor.Meteor.call("cart/createCart", userId, sessionId);
      var cart = _collections.Cart.findOne({ userId: userId });
      (0, _practicalmeteorChai.expect)(cartInsertSpy).to.have.been.called;
      (0, _practicalmeteorChai.expect)(cartId).to.equal(cart._id);
    });
  });

  describe("cart/addToCart", function () {
    var quantity = 1;
    var product = void 0;
    var productId = void 0;
    var variantId = void 0;
    var permissionStub = void 0;
    var resetShipmentStub = void 0;
    var updateShipmentQuoteStub = void 0;

    before(function () {
      permissionStub = _practicalmeteorSinon.sinon.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });

      resetShipmentStub = _practicalmeteorSinon.sinon.stub(_meteor.Meteor.server.method_handlers, "cart/resetShipmentMethod", function () {
        check(arguments, [Match.Any]);
        return true;
      });
      updateShipmentQuoteStub = _practicalmeteorSinon.sinon.stub(_meteor.Meteor.server.method_handlers, "shipping/updateShipmentQuotes", function () {
        check(arguments, [Match.Any]);
        return true;
      });

      product = (0, _products.addProduct)();
      productId = product._id;
      variantId = _collections.Products.findOne({
        ancestors: [productId]
      })._id;
    });

    after(function () {
      permissionStub.restore();
      resetShipmentStub.restore();
      updateShipmentQuoteStub.restore();
    });

    it("should add item to cart", function (done) {
      var cart = _dburlesFactory.Factory.create("cart");
      var items = cart.items.length;
      spyOnMethod("addToCart", cart.userId);
      _meteor.Meteor.call("cart/addToCart", productId, variantId, quantity);
      _meteor.Meteor._sleepForMs(500);
      cart = _collections.Cart.findOne(cart._id);
      (0, _practicalmeteorChai.expect)(cart.items.length).to.equal(items + 1);
      (0, _practicalmeteorChai.expect)(cart.items[cart.items.length - 1].productId).to.equal(productId);
      done();
    });

    it.skip("should merge all items of same variant in cart", function () {
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shop._id;
      });
      spyOnMethod("addToCart", userId);
      var cartId = _meteor.Meteor.call("cart/createCart", userId, sessionId);

      _meteor.Meteor.call("cart/addToCart", productId, variantId, quantity);
      // add a second item of same variant
      _meteor.Meteor.call("cart/addToCart", productId, variantId, quantity);
      var cart = _collections.Cart.findOne(cartId);
      (0, _practicalmeteorChai.expect)(cart.items.length).to.equal(1);
      (0, _practicalmeteorChai.expect)(cart.items[0].quantity).to.equal(2);
    });

    it("should throw error an exception if user doesn't have a cart", function (done) {
      var userWithoutCart = _dburlesFactory.Factory.create("user");
      spyOnMethod("addToCart", userWithoutCart._id);
      function addToCartFunc() {
        return _meteor.Meteor.call("cart/addToCart", productId, variantId, quantity);
      }
      (0, _practicalmeteorChai.expect)(addToCartFunc).to.throw(_meteor.Meteor.Error, /Cart not found/);
      return done();
    });

    it("should throw error an exception if product doesn't exists", function (done) {
      var cart = _dburlesFactory.Factory.create("cart");
      spyOnMethod("addToCart", cart.userId);
      function addToCartFunc() {
        return _meteor.Meteor.call("cart/addToCart", "fakeProductId", variantId, quantity);
      }
      (0, _practicalmeteorChai.expect)(addToCartFunc).to.throw(_meteor.Meteor.Error, "Product not found [404]");
      return done();
    });
  });

  describe("cart/copyCartToOrder", function () {
    it("should throw error if cart user not current user", function (done) {
      var cart = _dburlesFactory.Factory.create("cart");
      spyOnMethod("copyCartToOrder", "wrongUserId");
      function copyCartFunc() {
        return _meteor.Meteor.call("cart/copyCartToOrder", cart._id);
      }
      (0, _practicalmeteorChai.expect)(copyCartFunc).to.throw(_meteor.Meteor.Error, /Access Denied/);
      return done();
    });

    it("should throw error if cart has no items", function (done) {
      var user1 = _dburlesFactory.Factory.create("user");
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shop._id;
      });

      sandbox.stub(_collections.Accounts, "findOne", function () {
        return {
          emails: [{
            address: "test@localhost",
            provides: "default"
          }]
        };
      });
      spyOnMethod("copyCartToOrder", user1._id);
      var cartId = _meteor.Meteor.call("cart/createCart", user1._id, sessionId);
      function copyCartFunc() {
        return _meteor.Meteor.call("cart/copyCartToOrder", cartId);
      }
      (0, _practicalmeteorChai.expect)(copyCartFunc).to.throw(_meteor.Meteor.Error, /Missing cart items/);
      return done();
    });

    it("should throw an error if order creation has failed", function () {
      var cart = _dburlesFactory.Factory.create("cartToOrder");
      spyOnMethod("copyCartToOrder", cart.userId);
      // The main moment of test. We are spy on `insert` operation but do not
      // let it through this call
      var insertStub = sandbox.stub(_api.Reaction.Collections.Orders, "insert");
      function copyCartFunc() {
        return _meteor.Meteor.call("cart/copyCartToOrder", cart._id);
      }
      (0, _practicalmeteorChai.expect)(copyCartFunc).to.throw(_meteor.Meteor.Error, /Invalid request/);
      (0, _practicalmeteorChai.expect)(insertStub).to.have.been.called;
    });

    it("should create an order", function (done) {
      var cart = _dburlesFactory.Factory.create("cartToOrder");
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return cart.shopId;
      });
      spyOnMethod("copyCartToOrder", cart.userId);
      // let's keep it simple. We don't want to see a long email about
      // success. But I leave it here in case if anyone want to check whole
      // method flow.
      var insertStub = sandbox.stub(_api.Reaction.Collections.Orders, "insert");
      function copyCartFunc() {
        return _meteor.Meteor.call("cart/copyCartToOrder", cart._id);
      }

      (0, _practicalmeteorChai.expect)(copyCartFunc).to.throw(_meteor.Meteor.Error, /Invalid request/);
      (0, _practicalmeteorChai.expect)(insertStub).to.have.been.called;
      return done();
    });
  });

  describe("cart/unsetAddresses", function () {
    it("should correctly remove addresses from cart", function (done) {
      var cart = _dburlesFactory.Factory.create("cart");
      spyOnMethod("setShipmentAddress", cart.userId);
      spyOnMethod("setPaymentAddress", cart.userId);

      var cartId = cart._id;
      var address = Object.assign({}, (0, _shops.getAddress)(), {
        _id: Random.id(),
        isShippingDefault: true,
        isBillingDefault: true
      });

      _meteor.Meteor.call("cart/setPaymentAddress", cartId, address);
      _meteor.Meteor.call("cart/setShipmentAddress", cartId, address);
      cart = _collections.Cart.findOne(cartId);
      (0, _practicalmeteorChai.expect)(cart).not.to.be.undefined;
      (0, _practicalmeteorChai.expect)(cart.shipping[0].address._id).to.equal(address._id);
      (0, _practicalmeteorChai.expect)(cart.billing[0].address._id).to.equal(address._id);

      // our Method checking
      _meteor.Meteor.call("cart/unsetAddresses", address._id, cart.userId);

      cart = _collections.Cart.findOne(cartId);
      (0, _practicalmeteorChai.expect)(cart).to.not.be.undefined;
      (0, _practicalmeteorChai.expect)(cart.shipping[0].address).to.be.undefined;
      (0, _practicalmeteorChai.expect)(cart.billing[0].address).to.be.undefined;
      return done();
    });

    it("should throw error if wrong arguments were passed", function (done) {
      var accountUpdateStub = sandbox.stub(_collections.Accounts, "update");

      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("cart/unsetAddresses", 123456);
      }).to.throw;

      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("cart/unsetAddresses", {});
      }).to.throw;

      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("cart/unsetAddresses", null);
      }).to.throw;

      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("cart/unsetAddresses");
      }).to.throw;

      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("cart/unsetAddresses", "asdad", 123);
      }).to.throw;

      // https://github.com/aldeed/meteor-simple-schema/issues/522
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookRemove", function () {
          (0, _practicalmeteorChai.expect)(true).to.be.true;
        });
      }).to.not.throw;

      (0, _practicalmeteorChai.expect)(accountUpdateStub).to.not.have.been.called;
      accountUpdateStub.restore();
      return done();
    });

    it("should update cart via `type` argument", function (done) {
      var cart = _dburlesFactory.Factory.create("cart");
      spyOnMethod("setShipmentAddress", cart.userId);
      spyOnMethod("setPaymentAddress", cart.userId);

      var cartId = cart._id;
      var address = Object.assign({}, (0, _shops.getAddress)(), {
        _id: Random.id(),
        isShippingDefault: true,
        isBillingDefault: true
      });
      _meteor.Meteor.call("cart/setPaymentAddress", cartId, address);
      _meteor.Meteor.call("cart/setShipmentAddress", cartId, address);
      cart = _collections.Cart.findOne(cartId);

      (0, _practicalmeteorChai.expect)(cart.shipping[0].address._id).to.equal(address._id);
      (0, _practicalmeteorChai.expect)(cart.billing[0].address._id).to.equal(address._id);

      _meteor.Meteor.call("cart/unsetAddresses", address._id, cart.userId, "billing");
      _meteor.Meteor.call("cart/unsetAddresses", address._id, cart.userId, "shipping");

      cart = _collections.Cart.findOne(cartId);

      (0, _practicalmeteorChai.expect)(cart.shipping[0].address).to.be.undefined;
      (0, _practicalmeteorChai.expect)(cart.billing[0].address).to.be.undefined;
      return done();
    });
  });
});