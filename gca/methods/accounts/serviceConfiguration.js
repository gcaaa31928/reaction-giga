"use strict";

var _meteor = require("meteor/meteor");

var _api = require("/server/api");

_meteor.Meteor.methods({
  "accounts/updateServiceConfiguration": function accountsUpdateServiceConfiguration(service, fields) {
    check(service, String);
    check(fields, Array);
    var dataToSave = {};

    _.each(fields, function (field) {
      dataToSave[field.property] = field.value;
    });

    if (_api.Reaction.hasPermission(["dashboard/accounts"])) {
      return ServiceConfiguration.configurations.upsert({
        service: service
      }, {
        $set: dataToSave
      });
    }
    return false;
  }
});