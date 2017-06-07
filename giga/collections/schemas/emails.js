"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Emails = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var Emails = exports.Emails = new _aldeedSimpleSchema.SimpleSchema({
  to: {
    type: String
  },

  from: {
    type: String
  },

  subject: {
    type: String
  },

  text: {
    type: String,
    optional: true
  },

  html: {
    type: String,
    optional: true
  },

  userId: {
    type: String,
    optional: true
  },

  jobId: {
    type: String,
    index: true
  },

  type: {
    type: String,
    optional: true
  },

  status: {
    type: String
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
      return this.unset();
    }
  },

  updatedAt: {
    type: Date,
    autoValue: function autoValue() {
      if (this.isUpdate) {
        return new Date();
      }
      return this.unset();
    },

    denyInsert: true,
    optional: true
  }
});