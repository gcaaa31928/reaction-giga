"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ReactionAnalyticsPackageConfig = exports.AnalyticsEvents = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var _alanningRoles = require("meteor/alanning:roles");

var _api = require("/lib/api");

var _registry = require("./registry");

var _helpers = require("./helpers");

var AnalyticsEvents = exports.AnalyticsEvents = new _aldeedSimpleSchema.SimpleSchema({
  "eventType": {
    type: String
  },
  "category": {
    type: String,
    optional: true
  },
  "action": {
    type: String,
    optional: true
  },
  "label": {
    type: String,
    optional: true
  },
  "value": {
    type: String,
    optional: true
  },
  "user": {
    type: Object,
    optional: true
  },
  "user.id": {
    type: String,
    regEx: _aldeedSimpleSchema.SimpleSchema.RegEx.Id,
    optional: true,
    autoValue: function autoValue() {
      return Meteor.userId();
    }
  },
  "user.isAnonymous": {
    type: Boolean,
    optional: true,
    autoValue: function autoValue() {
      return _alanningRoles.Roles.userIsInRole(Meteor.user(), "anonymous", (0, _api.getShopId)());
    }
  },
  "shopId": {
    type: String,
    regEx: _aldeedSimpleSchema.SimpleSchema.RegEx.Id,
    autoValue: _helpers.shopIdAutoValue,
    label: "AnalyticsEvents shopId"
  },
  "createdAt": {
    type: Date,
    autoValue: function autoValue() {
      return new Date();
    }
  },
  // Any additional data
  "data": {
    type: Object,
    blackbox: true,
    optional: true
  }
});

/*
 *   Analytics
 *   api_key: "UA-XXXXX-X" (this is your tracking ID)
 */

var ReactionAnalyticsPackageConfig = exports.ReactionAnalyticsPackageConfig = new _aldeedSimpleSchema.SimpleSchema([_registry.PackageConfig, {
  "settings.public.segmentio.enabled": {
    type: Boolean,
    label: "Enabled"
  },
  "settings.public.segmentio.api_key": {
    type: String,
    label: "Segment Write Key",
    optional: true
  },
  "settings.public.googleAnalytics.enabled": {
    type: Boolean,
    label: "Enabled"
  },
  "settings.public.googleAnalytics.api_key": {
    type: String,
    label: "Google Analytics Tracking ID",
    optional: true
  },
  "settings.public.mixpanel.enabled": {
    type: Boolean,
    label: "Enabled"
  },
  "settings.public.mixpanel.api_key": {
    type: String,
    label: "Mixpanel Token",
    optional: true
  }
}]);