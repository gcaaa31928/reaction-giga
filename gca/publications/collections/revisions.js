"use strict";

var _collections = require("/lib/collections");

var _api = require("/server/api");

var _check = require("meteor/check");

/**
 * accounts
 */

Meteor.publish("Revisions", function (documentIds) {
  (0, _check.check)(documentIds, _check.Match.OneOf(String, Array));

  // we could additionally make checks of useId defined, but this could lead to
  // situation when user will may not have time to get an account
  if (this.userId === null) {
    return this.ready();
  }
  var shopId = _api.Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }

  if (Roles.userIsInRole(this.userId, ["admin", "owner"])) {
    if (Array.isArray(documentIds)) {
      return _collections.Revisions.find({
        // shopId,
        documentId: {
          $in: documentIds
        }
      });
    }

    // global admin can get all accounts
    return _collections.Revisions.find({
      // shopId,
      documentId: documentIds
    });
  }
  // regular users should get just their account
  return this.ready();
});