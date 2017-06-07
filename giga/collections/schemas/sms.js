"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Sms = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var Sms = exports.Sms = new _aldeedSimpleSchema.SimpleSchema({
  apiKey: {
    type: String,
    optional: true
  },
  apiToken: {
    type: String,
    optional: true
  },
  shopId: {
    type: String,
    optional: true
  },
  smsPhone: {
    type: String,
    optional: true
  },
  smsProvider: {
    type: String,
    optional: true
  }
});