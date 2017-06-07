"use strict";

var _collections = require("/lib/collections");

var _api = require("/server/api");

var _api2 = require("/lib/api");

var _alanningRoles = require("meteor/alanning:roles");

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * Packages contains user specific configuration
 * @summary  package publication settings, filtered by permissions
 * @param {Object} shopCursor - current shop object
 * @returns {Object} packagesCursor - current packages for shop
 */

// for transforming packages before publication sets some defaults for the client and adds i18n while checking
// privileged settings for enabled status.
function transform(doc, userId) {
  var registrySettings = {};
  var packageSettings = {};
  var permissions = ["admin", "owner", doc.name];

  // Get all permissions, add them to an array
  if (doc.registry && doc.registry.permissions) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = doc.registry.permissions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var item = _step.value;

        permissions.push(item.permission);
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
  }
  permissions = _.uniq(permissions);

  // check for admin,owner or package permissions to view settings
  var hasAdmin = _alanningRoles.Roles.userIsInRole(userId, permissions, doc.shopId);

  if (doc.registry) {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = doc.registry[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var registry = _step2.value;

        // add some normalized defaults
        registry.packageId = doc._id;
        registry.shopId = doc.shopId;
        registry.packageName = registry.packageName || doc.name;
        registry.settingsKey = (registry.name || doc.name).split("/").splice(-1)[0];
        // check and set package enabled state
        registry.permissions = [].concat(_toConsumableArray(permissions));
        if (registry.route) {
          registry.permissions.push(registry.name || doc.name + "/" + registry.template);
        }
        if (doc.settings && doc.settings[registry.settingsKey]) {
          registry.enabled = !!doc.settings[registry.settingsKey].enabled;
        } else {
          registry.enabled = !!doc.enabled;
        }
        // define export settings
        registrySettings[registry.settingsKey] = {
          enabled: registry.enabled
        };

        // add i18n keys
        registry = (0, _api2.translateRegistry)(registry, doc);
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
  // admin users get all settings the intent of this it so block publication of settings without limiting the use settings
  // in this transform. non admin users should get public setting
  if (hasAdmin === false && doc.settings) {
    registrySettings.public = doc.settings.public;
    delete doc.settings;
    Object.assign(packageSettings, registrySettings);
    doc.settings = packageSettings;
  }

  return doc;
}

//
//  Packages Publication
//
Meteor.publish("Packages", function (shopCursor) {
  check(shopCursor, Match.Optional(Object));
  var self = this;
  var shop = shopCursor || _api.Reaction.getCurrentShop();

  // user is required.
  if (self.userId) {
    // default options, we're limiting fields here that we don't want to publish unless admin user. in particular, settings
    // should not be published but we need to use settings in the transform everything except settings.public and
    // settings.*.enabled are removed in transform
    var options = {
      fields: {
        shopId: 1,
        name: 1,
        enabled: 1,
        registry: 1,
        layout: 1,
        icon: 1,
        settings: 1,
        audience: 1
      }
    };

    // we should always have a shop
    if (shop) {
      // if admin user, return all shop properties
      if (_alanningRoles.Roles.userIsInRole(self.userId, ["dashboard", "owner", "admin"], _api.Reaction.getShopId() || _alanningRoles.Roles.userIsInRole(self.userId, ["owner", "admin"], _alanningRoles.Roles.GLOBAL_GROUP))) {
        options = {};
      }
      // observe and transform Package registry adds i18n and other meta data
      var observer = _collections.Packages.find({
        shopId: shop._id
      }, options).observe({
        added: function added(doc) {
          self.added("Packages", doc._id, transform(doc, self.userId));
        },
        changed: function changed(newDoc, origDoc) {
          self.changed("Packages", origDoc._id, transform(newDoc, self.userId));
        },
        removed: function removed(origDoc) {
          self.removed("Packages", origDoc._id);
        }
      });

      self.onStop(function () {
        observer.stop();
      });
    }
    return self.ready();
  }
});