"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Order = exports.OrderTransaction = exports.OrderItem = exports.Notes = exports.History = exports.Document = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var _workflow = require("./workflow");

/**
 * Order Document Schema
 */

var Document = exports.Document = new _aldeedSimpleSchema.SimpleSchema({
  docId: {
    type: String
  },
  docType: {
    type: String,
    optional: true
  }
});

/**
 * Order History Schema
 */

var History = exports.History = new _aldeedSimpleSchema.SimpleSchema({
  event: {
    type: String
  },
  value: {
    type: String
  },
  userId: {
    type: String
  },
  updatedAt: {
    type: Date
  }
});

/**
 * Order Notes Schema
 */

var Notes = exports.Notes = new _aldeedSimpleSchema.SimpleSchema({
  content: {
    type: String
  },
  userId: {
    type: String
  },
  updatedAt: {
    type: Date
  }
});

/**
 * OrderItems Schema
 * merges with Cart and Order to create Orders collection
 */
var OrderItem = exports.OrderItem = new _aldeedSimpleSchema.SimpleSchema({
  additionalField: {
    type: String,
    optional: true
  },
  workflow: {
    type: _workflow.Workflow,
    optional: true
  },
  history: {
    type: [History],
    optional: true
  },
  documents: {
    type: [Document],
    optional: true
  }
});

/**
 * OrderTransaction Schema
 * order transactions tie shipping, billing, and inventory transactions
 */
var OrderTransaction = exports.OrderTransaction = new _aldeedSimpleSchema.SimpleSchema({
  itemId: {
    type: String,
    optional: true
  },
  paymentId: {
    type: String,
    optional: true
  },
  shipmentId: {
    type: String,
    optional: true
  },
  inventoryId: {
    type: String,
    optional: true
  },
  createdAt: {
    type: Date,
    autoValue: function autoValue() {
      if (this.isUpdate && !this.isSet) {
        return new Date();
      }
      this.unset();
    },
    denyUpdate: true
  }
});

/**
 * Order Schema
 */
var Order = exports.Order = new _aldeedSimpleSchema.SimpleSchema({
  userId: {
    type: String,
    unique: false
  },
  cartId: {
    type: String,
    optional: true
  },
  history: {
    type: [History],
    optional: true
  },
  documents: {
    type: [Document],
    optional: true
  },
  notes: {
    type: [Notes],
    optional: true
  },
  items: {
    type: [OrderItem],
    optional: true
  },
  transactions: {
    type: [OrderTransaction],
    optional: true
  }
});