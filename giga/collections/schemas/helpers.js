"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shopIdAutoValue = shopIdAutoValue;
exports.schemaIdAutoValue = schemaIdAutoValue;

var _meteor = require("meteor/meteor");

var _random = require("meteor/random");

var _api = require("/lib/api");

/**
 * shopIdAutoValue
 * @summary used for schema injection autoValue
 * @example autoValue: shopIdAutoValue
 * @return {String} returns current shopId
 */
function shopIdAutoValue() {
  // we should always have a shopId
  if (this.isSet && _meteor.Meteor.isServer) {
    return this.value;
  } else if (_meteor.Meteor.isServer && !this.isUpdate || _meteor.Meteor.isClient && this.isInsert) {
    return (0, _api.getShopId)();
  }
  return this.unset();
}

/**
 * schemaIdAutoValue
 * @summary used for schema injection autoValue
 * @example autoValue: schemaIdAutoValue
 * @return {String} returns randomId
 */
function schemaIdAutoValue() {
  if (this.isSet && _meteor.Meteor.isServer) {
    return this.value;
  } else if (_meteor.Meteor.isServer && this.operator !== "$pull" || _meteor.Meteor.isClient && this.isInsert) {
    return _random.Random.id();
  }
  return this.unset();
}