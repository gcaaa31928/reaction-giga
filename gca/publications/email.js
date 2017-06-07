"use strict";

var _meteor = require("meteor/meteor");

var _collections = require("/lib/collections");

var _alanningRoles = require("meteor/alanning:roles");

/**
 * Email Job Logs
 * @type {Object} options - standard publication options object
 */
_meteor.Meteor.publish("Emails", function (query, options) {
  check(query, Match.Optional(Object));
  check(options, Match.Optional(Object));

  if (_alanningRoles.Roles.userIsInRole(this.userId, ["owner", "admin", "dashboard"])) {
    Counts.publish(this, "emails-count", _collections.Jobs.find({ type: "sendEmail" }));
    return _collections.Jobs.find({ type: "sendEmail" });
  }

  return this.ready();
});