"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.methods = undefined;

var _meteor = require("meteor/meteor");

var _check = require("meteor/check");

var _collections = require("/lib/collections");

var _api = require("/server/api");

var _api2 = require("/lib/api");

var methods = exports.methods = {
  "registry/update": function registryUpdate(packageId, name, fields) {
    (0, _check.check)(packageId, String);
    (0, _check.check)(name, String);
    (0, _check.check)(fields, Array);
    // settings use just the last name from full name so that schemas don't need to define overly complex names based with
    // x/x/x formatting.
    // TODO name could be optional, just use package name as default
    var setting = name.split("/").splice(-1);
    var dataToSave = {};
    dataToSave[setting] = {};
    var currentPackage = _collections.Packages.findOne(packageId);

    _.each(fields, function (field) {
      dataToSave[setting][field.property] = field.value;
    });

    if (currentPackage && currentPackage.settings) {
      dataToSave = (0, _api2.mergeDeep)(currentPackage.settings, dataToSave);
    }
    // user must have permission to package to update settings
    if (_api.Reaction.hasPermission([currentPackage.name])) {
      return _collections.Packages.upsert({
        _id: packageId,
        name: currentPackage.name,
        enabled: currentPackage.enabled
      }, {
        $set: {
          settings: dataToSave
        }
      }, { upsert: true });
    }

    return false;
  }
};

_meteor.Meteor.methods(methods);