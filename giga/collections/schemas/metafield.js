"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Metafield = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

/**
 * Metafield Schema
 */

var Metafield = exports.Metafield = new _aldeedSimpleSchema.SimpleSchema({
  key: {
    type: String,
    max: 30,
    optional: true
  },
  namespace: {
    type: String,
    max: 20,
    optional: true
  },
  scope: {
    type: String,
    optional: true
  },
  value: {
    type: String,
    optional: true
  },
  valueType: {
    type: String,
    optional: true
  },
  description: {
    type: String,
    optional: true
  }
});