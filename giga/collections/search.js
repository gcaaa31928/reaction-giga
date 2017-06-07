"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AccountSearch = exports.OrderSearch = exports.ProductSearch = undefined;

var _mongo = require("meteor/mongo");

var ProductSearch = exports.ProductSearch = new _mongo.Mongo.Collection("ProductSearch");
var OrderSearch = exports.OrderSearch = new _mongo.Mongo.Collection("OrderSearch");
var AccountSearch = exports.AccountSearch = new _mongo.Mongo.Collection("AccountSearch");