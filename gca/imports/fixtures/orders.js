"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.randomProcessor = randomProcessor;
exports.randomStatus = randomStatus;
exports.randomMode = randomMode;
exports.paymentMethod = paymentMethod;
exports.getUserId = getUserId;
exports.getShopId = getShopId;

exports.default = function () {
  Factory.define("order", _collections.Orders, {
    // Schemas.OrderItems
    additionalField: _faker2.default.lorem.sentence(),
    status: _faker2.default.lorem.sentence(3),
    history: [],
    documents: [],

    // Schemas.Order
    cartId: Random.id(),
    notes: [],

    // Schemas.Cart
    shopId: getShopId(),
    userId: getUserId(),
    sessionId: "Session",
    email: _faker2.default.internet.email(),
    workflow: {
      status: "new",
      workflow: ["coreOrderWorkflow/created"]
    },
    items: function items() {
      var product = (0, _products.addProduct)();
      var variant = _collections.Products.findOne({ ancestors: [product._id] });
      var childVariants = _collections.Products.find({ ancestors: [product._id, variant._id] }).fetch();
      var selectedOption = Random.choice(childVariants);
      var product2 = (0, _products.addProduct)();
      var variant2 = _collections.Products.findOne({ ancestors: [product2._id] });
      var childVariants2 = _collections.Products.find({ ancestors: [product2._id, variant2._id] }).fetch();
      var selectedOption2 = Random.choice(childVariants2);
      return [{
        _id: itemIdOne,
        title: "firstItem",
        shopId: product.shopId,
        productId: product._id,
        quantity: 1,
        variants: selectedOption,
        workflow: {
          status: "new"
        }
      }, {
        _id: itemIdTwo,
        title: "secondItem",
        shopId: product2.shopId,
        productId: product2._id,
        quantity: 1,
        variants: selectedOption2,
        workflow: {
          status: "new"
        }
      }];
    },
    requiresShipping: true,
    shipping: [{
      items: [{
        _id: itemIdOne,
        productId: Random.id(),
        shopId: Random.id(),
        variantId: Random.id(),
        packed: false
      }, {
        _id: itemIdTwo,
        productId: Random.id(),
        shopId: Random.id(),
        variantId: Random.id(),
        packed: false
      }]
    }], // Shipping Schema
    billing: [{
      _id: Random.id(),
      address: (0, _accounts.getAddress)({ isBillingDefault: true }),
      paymentMethod: paymentMethod({
        method: "credit",
        processor: "Example",
        storedCard: "Mastercard 2346",
        paymentPackageId: (0, _packages.getPkgData)("example-paymentmethod") ? (0, _packages.getPkgData)("example-paymentmethod")._id : "uiwneiwknekwewe",
        paymentSettingsKey: "example-paymentmethod",
        mode: "authorize",
        status: "created",
        amount: 12.45
      }),
      invoice: {
        total: 12.45,
        subtotal: 12.45,
        discounts: 0,
        taxes: 0.12,
        shipping: 4.00
      }
    }],
    state: "new",
    createdAt: new Date(),
    updatedAt: new Date()
  });

  /**
   * authorizedApprovedPaypalOrder Factory
   * @summary defines order factory which generates an authorized, apporved, paypal order.
   */
  Factory.define("authorizedApprovedPaypalOrder", _collections.Orders, Factory.extend("order", {
    billing: [{
      _id: Random.id(),
      address: (0, _accounts.getAddress)({ isBillingDefault: true }),
      paymentMethod: paymentMethod({
        processor: "Paypal",
        mode: "authorize",
        status: "approved"
      })
    }]
  }));
};

var _faker = require("faker");

var _faker2 = _interopRequireDefault(_faker);

var _collections = require("/lib/collections");

var _shops = require("./shops");

var _users = require("./users");

var _packages = require("./packages");

var _accounts = require("./accounts");

var _products = require("./products");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * order factory methods
 * @type {Object}
 * @summary reaction specific faker functions for providing fake order data for testing
 */

function randomProcessor() {
  return _.sample(["Stripe", "Paypal", "Braintree"]);
}

var itemIdOne = Random.id();
var itemIdTwo = Random.id();

function randomStatus() {
  return _.sample(["created", "approved", "failed", "canceled", "expired", "pending", "voided", "settled"]);
}

function randomMode() {
  return _.sample(["authorize", "capture", "refund", "void"]);
}

function paymentMethod(doc) {
  return _extends({}, doc, {
    processor: doc.processor ? doc.processor : randomProcessor(),
    storedCard: doc.storedCard ? doc.storedCard : "4242424242424242",
    transactionId: doc.transactionId ? doc.transactionId : Random.id(),
    status: doc.status ? doc.status : randomStatus(),
    mode: doc.mode ? doc.mode : randomMode(),
    authorization: "auth field",
    amount: doc.amount ? doc.amount : _faker2.default.commerce.price()
  });
}

function getUserId() {
  return (0, _users.getUser)()._id;
}

function getShopId() {
  return (0, _shops.getShop)()._id;
}

/**
 * order factory
 * @summary Factory for generating reaction orders
 */