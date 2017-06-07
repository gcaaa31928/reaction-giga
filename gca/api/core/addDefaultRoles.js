"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addRolesToDefaultRoleSet = addRolesToDefaultRoleSet;

var _check = require("meteor/check");

var _collections = require("/lib/collections");

var _api = require("/server/api");

/**
 * Add roles to the Shops.defaultRoles array
 * Options:
 * allShops: add supplied roles to all shops, defaults to false
 * roles: Array of roles to add to default roles set
 * shops: Array of shopIds that should be added to set
 * roleSets: Rolesets to add roles to, Options: ["defaultRoles", "defaultVisitorRole", "defaultSellerRoles"]
 * TODO: Review and eliminate rolesets other than "default"
 * @param {Object} options - See above for details
 * @returns {Number} result of Shops.update method (number of documents updated)
 */
function addRolesToDefaultRoleSet() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { allShops: false, roles: [], shops: [], roleSets: ["defaultRoles"] };

  (0, _check.check)(options.roles, [String]);
  (0, _check.check)(options.allShops, _check.Match.Maybe(Boolean));
  (0, _check.check)(options.shops, _check.Match.Maybe([String]));
  (0, _check.check)(options.roleSets, _check.Match.Maybe([String]));

  var allShops = options.allShops,
      roles = options.roles,
      shops = options.shops,
      roleSets = options.roleSets;

  var query = {};
  var update = {};

  if (!allShops) {
    // if we're not updating all shops, we should only update the shops passed in.
    query._id = {
      $in: shops || []
    };
  }

  roleSets.forEach(function (roleSet) {
    // We should add each role to each roleSet passed in.
    update[roleSet] = { $each: roles };
  });

  if (allShops) {
    _api.Logger.debug("Adding roles " + roles + " to roleSets  " + roleSets + " for all shops");
  } else {
    _api.Logger.debug("Adding roles: " + roles + " to roleSets: " + roleSets + " for shops: " + shops);
  }

  return _collections.Shops.update(query, { $addToSet: update }, { multi: true });
}