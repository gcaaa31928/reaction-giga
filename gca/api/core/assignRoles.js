"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assignOwnerRoles = assignOwnerRoles;

var _alanningRoles = require("meteor/alanning:roles");

var _api = require("/server/api");

/**
 * getRouteName
 * assemble route name to be standard
 * this is duplicate that exists in Reaction.Router
 * however this is to avoid a dependency in core
 * on the router
 * prefix/package name + registry name or route
 * @param  {[type]} packageName  [package name]
 * @param  {[type]} registryItem [registry object]
 * @return {String}              [route name]
 */
function getRouteName(packageName, registryItem) {
  var routeName = void 0;
  if (packageName && registryItem) {
    if (registryItem.name) {
      routeName = registryItem.name;
    } else if (registryItem.template) {
      routeName = packageName + "/" + registryItem.template;
    } else {
      routeName = "" + packageName;
    }
    // dont include params in the name
    routeName = routeName.split(":")[0];
    return routeName;
  }
  return null;
}

/**
 * assignOwnerRoles
 * populate roles with all the packages and their permissions
 * this is the main way that roles are inserted and created for
 * admin user.
 * we assign all package roles to each owner account for each shopId
 * we assign only basic GLOBAL_GROUP rights
 *
 * @param  {String} shopId - shopId
 * @param  {String} pkgName - Package name
 * @param  {String} registry - registry object
 * @return {undefined}
 */

function assignOwnerRoles(shopId, pkgName, registry) {
  var defaultRoles = ["owner", "admin", "createProduct", "guest", pkgName];
  var globalRoles = defaultRoles;

  if (registry) {
    // for each registry item define and push roles
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = registry[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var registryItem = _step.value;

        // packages don't need to define specific permission routes.,
        // the routeName will be used as default roleName for each route.
        // todo: check dependency on this.
        var roleName = getRouteName(pkgName, registryItem);
        if (roleName) {
          defaultRoles.push(roleName);
        }

        // Get all defined permissions, add them to an array
        // define permissions if you need to check custom permission
        if (registryItem.permissions) {
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = registryItem.permissions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var permission = _step2.value;

              defaultRoles.push(permission.permission);
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  } else {
    _api.Logger.debug("No routes loaded for " + pkgName);
  }
  // only unique roles
  var defaultOwnerRoles = _.uniq(defaultRoles);
  // get existing shop owners to add new roles to
  var owners = [];
  var shopOwners = _alanningRoles.Roles.getUsersInRole(defaultOwnerRoles).fetch();
  // just a nice warning. something is misconfigured.
  if (!shopOwners) {
    _api.Logger.warn("Cannot assign roles without existing owner users.");
    return;
  }
  // assign this package permission to each existing owner.
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = shopOwners[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var account = _step3.value;

      owners.push(account._id);
    }
    // we don't use accounts/addUserPermissions here because we may not yet have permissions
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  _alanningRoles.Roles.addUsersToRoles(owners, defaultOwnerRoles, shopId);

  // the reaction owner has permissions to all sites by default
  _alanningRoles.Roles.addUsersToRoles(owners, globalRoles, _alanningRoles.Roles.GLOBAL_GROUP);

  _api.Logger.debug("Owner permissions added for " + pkgName);
}