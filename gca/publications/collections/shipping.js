"use strict";

var _meteor = require("meteor/meteor");

var _check = require("meteor/check");

var _tmeasdayPublishCounts = require("meteor/tmeasday:publish-counts");

var _collections = require("/lib/collections");

var _api = require("/server/api");

/**
 * shipping
 */

_meteor.Meteor.publish("Shipping", function (query, options) {
  (0, _check.check)(query, _check.Match.Optional(Object));
  (0, _check.check)(options, _check.Match.Optional(Object));

  var shopId = _api.Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }
  var select = query || {};
  select.shopId = shopId;

  // appends a count to the collection
  // we're doing this for use with griddleTable
  _tmeasdayPublishCounts.Counts.publish(this, "shipping-count", _collections.Shipping.find(select, options));

  return _collections.Shipping.find(select, options);
});