"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Cart = exports.CartItems = exports.CartItem = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var _helpers = require("./helpers");

var _payments = require("./payments");

var _products = require("./products");

var _shipping = require("./shipping");

var _workflow = require("./workflow");

/**
 * CartItem Schema
 */

var CartItem = exports.CartItem = new _aldeedSimpleSchema.SimpleSchema({
  _id: {
    type: String
  },
  productId: {
    type: String,
    index: 1
  },
  shopId: {
    type: String,
    autoValue: _helpers.shopIdAutoValue,
    index: 1,
    label: "Cart Item shopId",
    optional: true
  },
  quantity: {
    label: "Quantity",
    type: Number,
    min: 0
  },
  variants: {
    type: _products.ProductVariant
  },
  title: {
    type: String,
    label: "CartItem Title"
  },
  type: {
    label: "Product Type",
    type: String,
    optional: true
  },
  parcel: { // Currently the parcel is in the simple product schema, so we need to include it here as well. Maybe it should go in productvariant
    type: _shipping.ShippingParcel,
    optional: true
  },
  cartItemId: { // Seems strange here but has to be here since we share schemas between cart and order
    type: String,
    optional: true
  }
});

/**
 * CartItem Schema
 * used in check by inventory/addReserve method
 */

var CartItems = exports.CartItems = new _aldeedSimpleSchema.SimpleSchema({
  items: {
    type: [CartItem],
    optional: true
  }
});

/**
 * Cart Schema
 */

var Cart = exports.Cart = new _aldeedSimpleSchema.SimpleSchema({
  _id: { // required for check of users' carts
    type: String,
    optional: true
  },
  shopId: {
    type: String,
    autoValue: _helpers.shopIdAutoValue,
    index: 1,
    label: "Cart ShopId"
  },
  userId: {
    type: String,
    unique: true,
    autoValue: function autoValue() {
      if (this.isInsert || this.isUpdate) {
        if (!this.isFromTrustedCode) {
          return this.userId;
        }
      } else {
        this.unset();
      }
    }
  },
  sessionId: {
    type: String,
    index: 1
  },
  email: {
    type: String,
    optional: true,
    index: 1,
    regEx: _aldeedSimpleSchema.SimpleSchema.RegEx.Email
  },
  items: {
    type: [CartItem],
    optional: true
  },
  shipping: {
    type: [_shipping.Shipment],
    optional: true,
    blackbox: true
  },
  billing: {
    type: [_payments.Payment],
    optional: true,
    blackbox: true
  },
  tax: {
    type: Number,
    decimal: true,
    optional: true
  },
  taxes: {
    type: [Object],
    optional: true,
    blackbox: true
  },
  discount: {
    type: Number,
    decimal: true,
    optional: true
  },
  workflow: {
    type: _workflow.Workflow,
    optional: true
  },
  createdAt: {
    type: Date,
    autoValue: function autoValue() {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return {
          $setOnInsert: new Date()
        };
      }
    },
    denyUpdate: true
  },
  updatedAt: {
    type: Date,
    autoValue: function autoValue() {
      if (this.isUpdate) {
        return {
          $set: new Date()
        };
      } else if (this.isUpsert) {
        return {
          $setOnInsert: new Date()
        };
      }
    },
    optional: true
  }
});