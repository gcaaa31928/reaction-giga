"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Refund = exports.Payment = exports.Currency = exports.Invoice = exports.PaymentMethod = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var _helpers = require("./helpers");

var _address = require("./address");

var _workflow = require("./workflow");

/**
 * PaymentMethod Schema
 */

var PaymentMethod = exports.PaymentMethod = new _aldeedSimpleSchema.SimpleSchema({
  processor: {
    type: String
  },
  paymentPackageId: {
    type: String
  },
  paymentSettingsKey: {
    type: String
  },
  storedCard: {
    type: String,
    optional: true
  },
  method: {
    type: String,
    allowedValues: ["credit", "debit", "shipping-credit"],
    optional: true
  },
  transactionId: {
    type: String
  },
  metadata: {
    type: Object,
    optional: true,
    blackbox: true
  },
  workflow: {
    type: _workflow.Workflow,
    optional: true
  },
  status: {
    type: String
  },
  mode: {
    type: String,
    allowedValues: ["authorize", "capture", "refund", "cancel", "void"]
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
    optional: true
  },
  authorization: {
    type: String,
    optional: true
  },
  amount: {
    type: Number,
    decimal: true,
    optional: true
  },
  currency: {
    type: String,
    optional: true
  },
  transactions: {
    type: [Object],
    optional: true,
    blackbox: true
  }
});

/**
 * Invoice Schema
 */

var Invoice = exports.Invoice = new _aldeedSimpleSchema.SimpleSchema({
  transaction: {
    type: String,
    optional: true
  },
  shipping: {
    type: Number,
    decimal: true,
    optional: true
  },
  taxes: {
    type: Number,
    decimal: true,
    optional: true
  },
  subtotal: {
    type: Number,
    decimal: true
  },
  discounts: {
    type: Number,
    decimal: true,
    optional: true
  },
  total: {
    type: Number,
    decimal: true
  }
});

/**
 * Currency Schema
 */

var Currency = exports.Currency = new _aldeedSimpleSchema.SimpleSchema({
  userCurrency: {
    type: String,
    optional: true
  },
  exchangeRate: {
    type: Number,
    decimal: true,
    optional: true
  }
});

/**
 * Payment Schema
 */

var Payment = exports.Payment = new _aldeedSimpleSchema.SimpleSchema({
  _id: {
    type: String,
    label: "Payment Id",
    autoValue: _helpers.schemaIdAutoValue
  },
  address: {
    type: _address.Address,
    optional: true
  },
  paymentMethod: {
    type: PaymentMethod,
    optional: true
  },
  invoice: {
    type: Invoice,
    optional: true
  },
  currency: {
    type: Currency,
    optional: true,
    defaultValue: "USD"
  }
});

var Refund = exports.Refund = new _aldeedSimpleSchema.SimpleSchema({
  type: {
    type: String
  },
  amount: {
    type: Number,
    decimal: true
  },
  created: {
    type: Number
  },
  currency: {
    type: String
  },
  raw: {
    type: Object,
    optional: true,
    blackbox: true
  }
});