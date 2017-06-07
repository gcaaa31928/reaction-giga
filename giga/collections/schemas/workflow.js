"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Workflow = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

/**
 * workflow schema for attaching to collection where
 * PackageWorkflow is controlling view flow
 * Shop defaultWorkflow is defined in Shop
 */

var Workflow = exports.Workflow = new _aldeedSimpleSchema.SimpleSchema({
  status: {
    type: String,
    defaultValue: "new",
    index: 1
  },
  workflow: {
    type: [String],
    optional: true
  }
});