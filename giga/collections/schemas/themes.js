"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Themes = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

/**
 * @summary Themes Schema
 * Schema for themes used in reaction-layout
 */

var Themes = exports.Themes = new _aldeedSimpleSchema.SimpleSchema({
  name: {
    type: String,
    index: true
  },

  author: {
    type: String,
    optional: true
  },

  layout: {
    type: String,
    optional: true,
    defaultValue: "coreLayout"
  },

  url: {
    type: String,
    optional: true
  },

  components: {
    type: [Object],
    optional: true,
    blackbox: true
  }
});