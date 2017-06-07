"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCartItem = getCartItem;
exports.createCart = createCart;

exports.default = function () {
  /**
   * Cart Factory
   * @summary define cart Factory
   */

  var cartNoItems = {
    shopId: (0, _shops.getShop)()._id,
    userId: _dburlesFactory.Factory.get("user"),
    sessionId: Random.id(),
    email: _faker2.default.internet.email(),
    items: [],
    shipping: [],
    billing: [],
    workflow: {
      status: "new",
      workflow: []
    },
    createdAt: _faker2.default.date.past(),
    updatedAt: new Date()
  };

  var cart = {
    shopId: (0, _shops.getShop)()._id,
    userId: _dburlesFactory.Factory.get("user"),
    sessionId: Random.id(),
    email: _faker2.default.internet.email(),
    items: [getCartItem(), getCartItem()],
    shipping: [],
    billing: [],
    workflow: {
      status: "new",
      workflow: []
    },
    createdAt: _faker2.default.date.past(),
    updatedAt: new Date()
  };

  var cartOne = {
    items: [getSingleCartItem()]
  };

  var cartTwo = {
    items: [getSingleCartItem({ cartQuantity: 2 })]
  };

  var addressForOrder = (0, _accounts.getAddress)();
  var cartToOrder = {
    shopId: (0, _shops.getShop)()._id,
    shipping: [{
      _id: Random.id(),
      address: addressForOrder
    }],
    billing: [{
      _id: Random.id(),
      address: addressForOrder
    }],
    workflow: {
      status: "checkoutPayment",
      workflow: ["checkoutLogin", "checkoutAddressBook", "coreCheckoutShipping", "checkoutReview", "checkoutPayment"]
    }
  };

  var anonymousCart = {
    userId: _dburlesFactory.Factory.get("anonymous")
  };

  _dburlesFactory.Factory.define("cart", _collections.Cart, Object.assign({}, cart));
  _dburlesFactory.Factory.define("cartToOrder", _collections.Cart, Object.assign({}, cart, cartToOrder));
  _dburlesFactory.Factory.define("anonymousCart", _collections.Cart, Object.assign({}, cart, anonymousCart));
  _dburlesFactory.Factory.define("cartOne", _collections.Cart, Object.assign({}, cart, cartToOrder, cartOne));
  _dburlesFactory.Factory.define("cartTwo", _collections.Cart, Object.assign({}, cart, cartToOrder, cartTwo));
  _dburlesFactory.Factory.define("cartNoItems", _collections.Cart, Object.assign({}, cart, cartToOrder, cartNoItems));
};

var _faker = require("faker");

var _faker2 = _interopRequireDefault(_faker);

var _dburlesFactory = require("meteor/dburles:factory");

var _collections = require("/lib/collections");

var _shops = require("./shops");

var _accounts = require("./accounts");

var _products = require("./products");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 *
 * @param {Object} [options] - Options object (optional)
 * @param {string} [options._id] - id of CartItem
 * @param {string} [options.productId] - _id of product that item came from
 * @param {string} [options.shopId] - _id of shop that item came from
 * @param {number} [options.quantity] - quantity of item in CartItem
 * @param {Object} [options.variants] - _single_ variant object. ¯\_(ツ)_/¯ why called variants
 *
 * @returns {Object} - randomly generated cartItem/orderItem data object
 */
function getCartItem() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var product = (0, _products.addProduct)();
  var variant = _collections.Products.findOne({ ancestors: [product._id] });
  var childVariants = _collections.Products.find({ ancestors: [product._id, variant._id] }).fetch();
  var selectedOption = Random.choice(childVariants);
  var defaults = {
    _id: Random.id(),
    productId: product._id,
    shopId: (0, _shops.getShop)()._id,
    quantity: _.random(1, selectedOption.inventoryQuantity),
    variants: selectedOption,
    title: product.title
  };
  return _.defaults(options, defaults);
}

function getSingleCartItem() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var cartItem = getCartItem(options);
  var quantity = options.cartQuantity || 1;
  cartItem.quantity = quantity;
  return cartItem;
}

function createCart(productId, variantId) {
  var product = _collections.Products.findOne(productId);
  var variant = _collections.Products.findOne(variantId);
  var user = _dburlesFactory.Factory.create("user");
  var cartItem = {
    _id: Random.id(),
    productId: product._id,
    shopId: (0, _shops.getShop)()._id,
    quantity: 1,
    variants: variant,
    title: product.title
  };

  var cart = {
    shopId: (0, _shops.getShop)()._id,
    userId: user._id,
    sessionId: Random.id(),
    email: _faker2.default.internet.email(),
    items: [cartItem],
    shipping: [{
      _id: Random.id(),
      address: (0, _accounts.getAddress)()
    }],
    billing: [{
      _id: Random.id(),
      address: (0, _accounts.getAddress)()
    }],
    workflow: {
      status: "checkoutPayment",
      workflow: ["checkoutLogin", "checkoutAddressBook", "coreCheckoutShipping", "checkoutReview", "checkoutPayment"]
    },
    createdAt: _faker2.default.date.past(),
    updatedAt: new Date()
  };
  var newCartId = _collections.Cart.insert(cart);
  var insertedCart = _collections.Cart.findOne(newCartId);
  return insertedCart;
}