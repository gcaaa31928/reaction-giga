"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Accounts = exports.Email = exports.Profile = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var _helpers = require("./helpers");

var _address = require("./address");

var _metafield = require("./metafield");

/**
 * Accounts Schemas
 */

var TaxSettings = new _aldeedSimpleSchema.SimpleSchema({
  exemptionNo: {
    type: String,
    optional: true
  },
  customerUsageType: {
    type: String,
    optional: true
  }
});

var Profile = exports.Profile = new _aldeedSimpleSchema.SimpleSchema({
  addressBook: {
    type: [_address.Address],
    optional: true
  },
  name: {
    type: String,
    optional: true
  },
  picture: {
    type: String,
    optional: true
  }
});

var Email = exports.Email = new _aldeedSimpleSchema.SimpleSchema({
  provides: {
    type: String,
    defaultValue: "default",
    optional: true
  },
  address: {
    type: String,
    regEx: _aldeedSimpleSchema.SimpleSchema.RegEx.Email
  },
  verified: {
    type: Boolean,
    defaultValue: false,
    optional: true
  }
});

/**
 * Reaction Schemas Accounts
 */

var Accounts = exports.Accounts = new _aldeedSimpleSchema.SimpleSchema({
  userId: {
    type: String,
    regEx: _aldeedSimpleSchema.SimpleSchema.RegEx.Id,
    index: 1,
    label: "Accounts ShopId"
  },
  sessions: {
    type: [String],
    optional: true,
    index: 1
  },
  shopId: {
    type: String,
    autoValue: _helpers.shopIdAutoValue,
    regEx: _aldeedSimpleSchema.SimpleSchema.RegEx.Id,
    index: 1
  },
  emails: {
    type: [Email],
    optional: true
  },
  acceptsMarketing: {
    type: Boolean,
    defaultValue: false,
    optional: true
  },
  state: {
    type: String,
    defaultValue: "new",
    optional: true
  },
  taxSettings: {
    type: TaxSettings,
    optional: true
  },
  note: {
    type: String,
    optional: true
  },
  profile: {
    type: Profile,
    optional: true
  },
  metafields: {
    type: [_metafield.Metafield],
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
    }
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