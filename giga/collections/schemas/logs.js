"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Logs = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var Logs = exports.Logs = new _aldeedSimpleSchema.SimpleSchema({

  logType: {
    type: String
  },
  shopId: {
    type: String
  },
  level: {
    type: String,
    defaultValue: "info",
    allowedValues: ["trace", "debug", "info", "warn", "error", "fatal"]
  },
  source: {
    type: String,
    defaultValue: "server",
    allowedValues: ["client", "server"]
  },
  handled: {
    type: Boolean,
    defaultValue: false
  },
  data: {
    type: Object,
    blackbox: true
  },
  date: {
    type: Date,
    autoValue: function autoValue() {
      return new Date();
    }
  }
});