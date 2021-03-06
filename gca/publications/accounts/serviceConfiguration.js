"use strict";

var _api = require("/server/api");

/**
 * Publish ServiceConfiguration
 * @param {String} checkUserId - we not using it directly because if shows not
 * correct userId. Instead of it we are believe only to `this.userId`
 */
Meteor.publish("ServiceConfiguration", function (checkUserId) {
  check(checkUserId, Match.OneOf(String, null));
  if (this.userId === null) {
    return this.ready();
  }
  // Admins and account managers can manage the login methods for the shop
  if (Roles.userIsInRole(this.userId, ["owner", "admin", "dashboard/accounts"], _api.Reaction.getShopId())) {
    return ServiceConfiguration.configurations.find({}, {
      fields: {
        secret: 1
      }
    });
  }

  return ServiceConfiguration.configurations.find({});
});