"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Address = undefined;

var _random = require("meteor/random");

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var _metafield = require("./metafield");

/**
* Reaction Schemas Address
*/

var Address = exports.Address = new _aldeedSimpleSchema.SimpleSchema({
  _id: {
    type: String,
    defaultValue: _random.Random.id(),
    optional: true
  },
  fullName: {
    type: String,
    label: "Full name"
  },
  address1: {
    label: "Address 1",
    type: String
  },
  address2: {
    label: "Address 2",
    type: String,
    optional: true
  },
  city: {
    type: String,
    label: "City"
  },
  company: {
    type: String,
    label: "Company",
    optional: true
  },
  phone: {
    type: String,
    label: "Phone"
  },
  region: {
    label: "State/Province/Region",
    type: String
  },
  postal: {
    label: "ZIP/Postal Code",
    type: String
  },
  country: {
    type: String,
    label: "Country"
  },
  isCommercial: {
    label: "This is a commercial address.",
    type: Boolean
  },
  isBillingDefault: {
    label: "Make this your default billing address?",
    type: Boolean
  },
  isShippingDefault: {
    label: "Make this your default shipping address?",
    type: Boolean
  },
  metafields: {
    type: [_metafield.Metafield],
    optional: true
  }
});