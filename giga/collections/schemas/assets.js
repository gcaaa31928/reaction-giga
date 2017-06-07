"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Assets = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var Assets = exports.Assets = new _aldeedSimpleSchema.SimpleSchema({
  type: {
    type: String
  },
  name: {
    type: String,
    optional: true
  },
  /**
   * namespace for i18n. This allows to load translation for custom plugins
   */
  ns: {
    type: String,
    optional: true
  },
  path: {
    type: String,
    optional: true
  },
  content: {
    type: String,
    optional: true
  }
});