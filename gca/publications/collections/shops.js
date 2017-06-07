"use strict";

var _api = require("/server/api");

/**
 * shops
 * @returns {Object} shop - current shop cursor
 */

Meteor.publish("Shops", function () {
  return _api.Reaction.getCurrentShopCursor();
});