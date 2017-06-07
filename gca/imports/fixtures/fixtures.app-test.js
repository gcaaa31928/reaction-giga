"use strict";

var _meteor = require("meteor/meteor");

var _practicalmeteorChai = require("meteor/practicalmeteor:chai");

var _practicalmeteorSinon = require("meteor/practicalmeteor:sinon");

var _api = require("/server/api");

var _collections = require("/lib/collections");

var Collections = _interopRequireWildcard(_collections);

var _fixtures = require("/server/imports/fixtures");

var _fixtures2 = _interopRequireDefault(_fixtures);

var _products = require("/server/imports/fixtures/products");

var _cart = require("/server/imports/fixtures/cart");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

(0, _fixtures2.default)();

describe("Fixtures:", function () {
  var sandbox = void 0;

  beforeEach(function () {
    sandbox = _practicalmeteorSinon.sinon.sandbox.create();
    Collections.Orders.direct.remove();
  });

  afterEach(function () {
    sandbox.restore();
    Collections.Orders.direct.remove();
  });

  it("Account fixture should create an account", function () {
    var account = Factory.create("account");
    (0, _practicalmeteorChai.expect)(account).to.not.be.undefined;
    var accountCount = Collections.Accounts.find().count();
    (0, _practicalmeteorChai.expect)(accountCount).to.be.above(0);
  });

  it("Cart fixture should create a cart", function () {
    var cart = Factory.create("cart");
    (0, _practicalmeteorChai.expect)(cart).to.not.be.undefined;
    var cartCount = Collections.Cart.find().count();
    (0, _practicalmeteorChai.expect)(cartCount).to.be.above(0);
  });

  it("CartOne fixture should create a cart with one item with a quantity of one", function () {
    var cartOne = Factory.create("cartOne");
    (0, _practicalmeteorChai.expect)(cartOne).to.not.be.undefined;
    var createdCart = Collections.Cart.findOne(cartOne._id);
    (0, _practicalmeteorChai.expect)(createdCart).to.not.be.undefined;
    (0, _practicalmeteorChai.expect)(createdCart.items.length).to.equal(1);
    (0, _practicalmeteorChai.expect)(createdCart.items[0].quantity).to.equal(1);
  });

  it("CartTwo fixture should create a cart with one item with a quantity of two", function () {
    var cartOne = Factory.create("cartTwo");
    (0, _practicalmeteorChai.expect)(cartOne).to.not.be.undefined;
    var createdCart = Collections.Cart.findOne(cartOne._id);
    (0, _practicalmeteorChai.expect)(createdCart).to.not.be.undefined;
    (0, _practicalmeteorChai.expect)(createdCart.items.length).to.equal(1);
    (0, _practicalmeteorChai.expect)(createdCart.items[0].quantity).to.equal(2);
  });

  it("createCart function should create a cart with a specific product", function () {
    var _addProductSingleVari = (0, _products.addProductSingleVariant)(),
        product = _addProductSingleVari.product,
        variant = _addProductSingleVari.variant;

    var cart = (0, _cart.createCart)(product._id, variant._id);
    (0, _practicalmeteorChai.expect)(cart).to.not.be.undefined;
    var createdCart = Collections.Cart.findOne(cart._id);
    (0, _practicalmeteorChai.expect)(createdCart).to.not.be.undefined;
    (0, _practicalmeteorChai.expect)(createdCart.items.length).to.equal(1);
  });

  it("Order fixture should create an order", function () {
    // Order has analytics hooks on it that need to be turned off
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
    var order = Factory.create("order");
    (0, _practicalmeteorChai.expect)(order).to.not.be.undefined;
    var orderCount = Collections.Orders.find().count();
    (0, _practicalmeteorChai.expect)(orderCount).to.be.above(0);
  });

  it("Shop fixture should create a Shop", function () {
    var shop = Factory.create("shop");
    (0, _practicalmeteorChai.expect)(shop).to.not.be.undefined;
    var shopCount = Collections.Shops.find().count();
    (0, _practicalmeteorChai.expect)(shopCount).to.be.above(1);
  });

  it("Product fixture should create a product", function () {
    var product = Factory.create("product");
    (0, _practicalmeteorChai.expect)(product).to.not.be.undefined;
    var productCount = Collections.Products.find().count();
    (0, _practicalmeteorChai.expect)(productCount).to.be.above(0);
  });
});