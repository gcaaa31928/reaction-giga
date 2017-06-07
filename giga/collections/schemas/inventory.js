"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Inventory = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var _helpers = require("./helpers");

var _orders = require("./orders");

var _metafield = require("./metafield");

var _workflow = require("./workflow");

var Inventory = exports.Inventory = new _aldeedSimpleSchema.SimpleSchema({
  _id: {
    type: String,
    optional: true // inserted by mongo, we need it for schema validation
  },
  shopId: {
    type: String,
    autoValue: _helpers.shopIdAutoValue,
    index: 1,
    label: "Inventory ShopId"
  },
  productId: {
    type: String,
    index: true
  },
  variantId: {
    type: String,
    index: true
  },
  orderItemId: {
    type: String,
    index: true,
    optional: true
  },
  workflow: {
    type: _workflow.Workflow,
    optional: true
  },
  sku: {
    label: "sku",
    type: String,
    optional: true
  },
  metafields: {
    type: [_metafield.Metafield],
    optional: true
  },
  documents: {
    type: [_orders.Document],
    optional: true
  },
  notes: {
    type: [_orders.Notes],
    optional: true
  },
  createdAt: {
    type: Date,
    optional: true, // schema validation failing in method with this required. should be considered temporary.
    autoValue: function autoValue() {
      if (this.isInsert || this.isUpdate && !this.isSet) {
        return new Date();
      }
      this.unset();
    }
  },
  updatedAt: {
    type: Date,
    autoValue: function autoValue() {
      return new Date();
    },
    optional: true
  }
});