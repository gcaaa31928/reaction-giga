"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Translation = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var _helpers = require("./helpers");

/*
* translations schema
* mostly just a blackbox for now
* someday maybe we'll validate the entire schema
* since ui editing for these values are likely
*/

var Translation = exports.Translation = new _aldeedSimpleSchema.SimpleSchema({
  shopId: {
    type: String,
    index: 1,
    autoValue: _helpers.shopIdAutoValue,
    label: "Translation ShopId"
  },
  language: {
    type: String
  },
  i18n: {
    type: String,
    index: 1
  },
  ns: {
    type: String,
    label: "Namespace"
  },
  translation: {
    type: Object,
    blackbox: true
  }
});