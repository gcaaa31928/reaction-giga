"use strict";

var _meteor = require("meteor/meteor");

var _ejson = require("meteor/ejson");

var _alanningRoles = require("meteor/alanning:roles");

var _api = require("/server/api");

/* eslint quote-props: 0 */
/**
 * ShopMembers
 * This publication is only exposed to owner/admin in
 * Accounts page, and should not be used anywhere else.
 *
 * @return {Array} users
 */
_meteor.Meteor.publish("ShopMembers", function () {
  // here we are comparing with the string to make it compatible with tests
  if (typeof this.userId !== "string") {
    return this.ready();
  }
  var readPermissions = ["reaction-orders", "owner", "admin", "reaction-accounts"];
  var shopId = _api.Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }

  if (_alanningRoles.Roles.userIsInRole(this.userId, readPermissions, shopId)) {
    // seems like we can't use "`" inside db.call directly
    // do not add comments or otherwise format this query
    var selector = "{\"roles." + shopId + "\": {\"$nin\": [\"anonymous\"]}}";
    var publish = {
      fields: {
        _id: 1,
        emails: 1,
        username: 1,
        roles: 1,
        "profile.lang": 1,
        "services.google.name": 1,
        "services.google.email": 1,
        "services.google.picture": 1,
        "services.twitter.name": 1,
        "services.twitter.email": 1,
        "services.twitter.profile_image_url_https": 1,
        "services.facebook.name": 1,
        "services.facebook.email": 1,
        "services.facebook.id": 1,
        "services.weibo.name": 1,
        "services.weibo.email": 1,
        "services.weibo.picture": 1,
        "services.github.name": 1,
        "services.github.email": 1,
        "services.github.username": 1
      }
    };

    return _meteor.Meteor.users.find(_ejson.EJSON.parse(selector), publish);
  }

  _api.Logger.debug("ShopMembers access denied");
  return this.ready();
});