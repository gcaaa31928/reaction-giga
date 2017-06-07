"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Template = exports.ReactLayout = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var _helpers = require("./helpers");

var sharedFields = {
  shopId: {
    type: String,
    index: 1,
    autoValue: _helpers.shopIdAutoValue,
    label: "Template ShopId"
  },
  name: {
    type: String
  },
  priority: {
    type: Number,
    optional: true,
    defaultValue: 1
  },
  enabled: {
    type: Boolean,
    defaultValue: true
  },
  route: {
    type: String,
    optional: true
  },
  // permissions: {
  //   type: [String],
  //   optional: true
  // },
  // audience: {
  //   type: [String],
  //   optional: true
  // },
  type: {
    type: String,
    defaultValue: "template"
  },

  provides: {
    type: String,
    defaultValue: "template"
  },
  block: {
    type: String,
    optional: true
  },
  defaultData: {
    type: Object,
    blackbox: true,
    optional: true
  },
  parser: {
    type: String
  },
  language: {
    type: String,
    optional: true,
    defaultValue: "en"
  },
  source: {
    type: String,
    optional: true
  }
};

var ReactLayout = exports.ReactLayout = new _aldeedSimpleSchema.SimpleSchema(_extends({}, sharedFields, {
  templateFor: {
    type: [String],
    optional: true
  },
  template: {
    type: [Object],
    optional: true,
    blackbox: true
  }
}));

var Template = exports.Template = new _aldeedSimpleSchema.SimpleSchema(_extends({}, sharedFields, {
  template: {
    type: String,
    optional: true
  }
}));