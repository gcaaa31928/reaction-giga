"use strict";

var _meteor = require("meteor/meteor");

var _tmeasdayPublishCounts = require("meteor/tmeasday:publish-counts");

var _collections = require("/lib/collections");

_meteor.Meteor.publish("shopsCount", function () {
  _tmeasdayPublishCounts.Counts.publish(this, "shops-count", _collections.Shops.find());
});