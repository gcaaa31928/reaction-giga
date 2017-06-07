"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Revisions = undefined;

var _workflow = require("./workflow");

var Revisions = exports.Revisions = new SimpleSchema({
  _id: {
    type: String,
    label: "Revision Id"
  },

  // status: {
  //   type: String,
  //   label: "Revision Status"
  // },

  workflow: {
    type: _workflow.Workflow,
    optional: false
  },

  documentId: {
    type: String,
    label: "Reference Document Id"
  },

  documentType: {
    type: String,
    label: "Document Type",
    defaultValue: "product",
    allowedValues: ["product", "image", "tag"]
  },

  parentDocument: {
    type: String,
    optional: true
  },

  documentData: {
    type: "object",
    blackbox: true
  },

  changeType: {
    type: String,
    optional: true,
    allowedValues: ["insert", "update", "remove"]
  },

  diff: {
    type: [Object],
    blackbox: true,
    optional: true
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
    type: Date,
    autoValue: function autoValue() {
      return new Date();
    },
    optional: true
  },

  publishAt: {
    type: Date,
    optional: true
  }
});