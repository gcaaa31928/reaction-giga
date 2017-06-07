"use strict";

var _collections = require("/lib/collections");

var _api = require("/server/api");

/**
 * tags
 */
Meteor.publish("Tags", function () {
  var shopId = _api.Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }
  return _collections.Tags.find({
    shopId: shopId
  });
});