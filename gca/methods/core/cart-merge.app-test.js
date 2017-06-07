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


describe("Merge Cart function ", function () {
  var shop = (0, _shops.getShop)();
  var sessionId = _api.Reaction.sessionId = Random.id();
  var originals = void 0;
  var sandbox = void 0;
  var pushCartWorkflowStub = void 0;
  var cartHookStub = void 0;
  var productHookStub = void 0;

  before(function () {
    // We are mocking inventory hooks, because we don't need them here, but
    if (Array.isArray(Collections.Products._hookAspects.remove.after) && Collections.Products._hookAspects.remove.after.length) {
      cartHookStub = _practicalmeteorSinon.sinon.stub(Collections.Cart._hookAspects.update.after[0], "aspect");
      productHookStub = _practicalmeteorSinon.sinon.stub(Collections.Products._hookAspects.remove.after[0], "aspect");
    }
    originals = {
      mergeCart: _meteor.Meteor.server.method_handlers["cart/mergeCart"],
      copyCartToOrder: _meteor.Meteor.server.method_handlers["cart/copyCartToOrder"],
      addToCart: _meteor.Meteor.server.method_handlers["cart/addToCart"],
      setShipmentAddress: _meteor.Meteor.server.method_handlers["cart/setShipmentAddress"],
      setPaymentAddress: _meteor.Meteor.server.method_handlers["cart/setPaymentAddress"]
    };

    Collections.Products.remove({});

    // mock it. If you want to make full integration test, comment this out
    pushCartWorkflowStub = _practicalmeteorSinon.sinon.stub(_meteor.Meteor.server.method_handlers, "workflow/pushCartWorkflow", function () {
      check(arguments, [Match.Any]);
      return true;
    });
  });

  after(function () {
    pushCartWorkflowStub.restore();
    cartHookStub.restore();
    productHookStub.restore();
  });

  beforeEach(function () {
    sandbox = _practicalmeteorSinon.sinon.sandbox.create();
    Collections.Cart.remove({});
  });

  afterEach(function () {
    sandbox.restore();
    _meteor.Meteor.users.remove({});
  });

  function spyOnMethod(method, id) {
    return sandbox.stub(_meteor.Meteor.server.method_handlers, "cart/" + method, function () {
      check(arguments, [Match.Any]); // to prevent audit_arguments from complaining
      this.userId = id;
      return originals[method].apply(this, arguments);
    });
  }

  it("should merge all anonymous carts into existent `normal` user cart per session, when logged in", function () {
    sandbox.stub(_api.Reaction, "getShopId", function () {
      return shop._id;
    });
    var anonymousCart = Factory.create("anonymousCart");
    var cart = Factory.create("cart");
    var cartCount = Collections.Cart.find().count();
    (0, _practicalmeteorChai.expect)(cartCount).to.equal(2);
    spyOnMethod("mergeCart", cart.userId);
    var cartRemoveSpy = sandbox.spy(Collections.Cart, "remove");
    Collections.Cart.update({}, {
      $set: {
        sessionId: sessionId
      }
    });
    var mergeResult = _meteor.Meteor.call("cart/mergeCart", cart._id, sessionId);
    (0, _practicalmeteorChai.expect)(mergeResult).to.be.ok;
    anonymousCart = Collections.Cart.findOne(anonymousCart._id);
    cart = Collections.Cart.findOne(cart._id);
    cartCount = Collections.Cart.find().count();
    (0, _practicalmeteorChai.expect)(cartCount).to.equal(1);
    (0, _practicalmeteorChai.expect)(cartRemoveSpy).to.have.been.called;
    (0, _practicalmeteorChai.expect)(anonymousCart).to.be.undefined;
    (0, _practicalmeteorChai.expect)(cart.items.length).to.equal(2);
  });

  it("should merge only into registered user cart", function (done) {
    sandbox.stub(_api.Reaction, "getShopId", function () {
      return shop._id;
    });
    var cart = Factory.create("anonymousCart");
    spyOnMethod("mergeCart", cart.userId);
    var cartId = cart._id;
    // now we try to merge two anonymous carts. We expect to see `false`
    // result
    (0, _practicalmeteorChai.expect)(_meteor.Meteor.call("cart/mergeCart", cartId)).to.be.false;
    return done();
  });

  it("should throw an error if cart doesn't exist", function (done) {
    spyOnMethod("mergeCart", "someIdHere");
    function mergeCartFunction() {
      _meteor.Meteor.call("cart/mergeCart", "non-existent-id", sessionId);
    }
    (0, _practicalmeteorChai.expect)(mergeCartFunction).to.throw(_meteor.Meteor.Error, /Access Denied/);
    return done();
  });

  it("should throw an error if cart user is not current user", function (done) {
    var cart = Factory.create("cart");
    spyOnMethod("mergeCart", "someIdHere");
    function mergeCartFunction() {
      return _meteor.Meteor.call("cart/mergeCart", cart._id, "someSessionId");
    }
    (0, _practicalmeteorChai.expect)(mergeCartFunction).to.throw(_meteor.Meteor.Error, /Access Denied/);
    return done();
  });
});