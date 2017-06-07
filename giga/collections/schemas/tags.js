"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Tag = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var _helpers = require("./helpers");

/**
 * Tag Schema
 */

var Tag = exports.Tag = new _aldeedSimpleSchema.SimpleSchema({
  _id: {
    type: String,
    optional: true
  },
  name: {
    type: String,
    index: 1
  },
  slug: {
    type: String
  },
  position: {
    type: Number,
    optional: true
  },
  relatedTagIds: {
    type: [String],
    optional: true,
    index: 1
  },
  isDeleted: {
    type: Boolean,
    defaultValue: false
  },
  isTopLevel: {
    type: Boolean
  },
  shopId: {
    type: String,
    index: 1,
    autoValue: _helpers.shopIdAutoValue,
    label: "Tag shopId"
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
    type: Date
  }
});