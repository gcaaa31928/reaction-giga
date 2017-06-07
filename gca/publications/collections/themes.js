"use strict";

var _collections = require("/lib/collections");

/**
 * Themes
 * @returns {Object} thtmes - themes cursor
 */

Meteor.publish("Themes", function () {
  return _collections.Themes.find({});
});