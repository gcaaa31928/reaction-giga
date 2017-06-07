"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Jobs = undefined;

var _vsivsiJobCollection = require("meteor/vsivsi:job-collection");

/**
 * Jobs Collection
 */
var Jobs = exports.Jobs = new _vsivsiJobCollection.JobCollection("Jobs", {
  noCollectionSuffix: true
});