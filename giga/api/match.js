"use strict";

var _check = require("meteor/check");

/**
 * Match.OptionalOrNull
 * See Meteor Match methods
 * @param {String} pattern - match pattern
 * @return {Boolean} matches - void, null, or pattern
 */
_check.Match.OptionalOrNull = function (pattern) {
  return _check.Match.OneOf(void 0, null, pattern);
};

/**
 * Match.OrderHookOption
 * See Meteor Match methods
 * @return {Boolean} matches - void, null, or pattern
 */
_check.Match.OrderHookOptions = function () {
  return _check.Match.OneOf(Object);
};