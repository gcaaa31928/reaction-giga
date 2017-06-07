"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CorePackageConfig = exports.PackageConfig = exports.Registry = exports.Permissions = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var _layouts = require("./layouts");

/**
 * Permissions Schema
 */

var Permissions = exports.Permissions = new _aldeedSimpleSchema.SimpleSchema({
  permission: {
    type: String
  },
  label: {
    type: String
  }
});

/**
 * Permissions Registry
 * the registry entries in the Package registry
 */

var Registry = exports.Registry = new _aldeedSimpleSchema.SimpleSchema({
  provides: {
    type: String,
    index: true
  },
  route: {
    type: String,
    optional: true,
    index: true
  },
  name: {
    type: String,
    label: "Registry Name",
    index: true
  },
  template: {
    type: String,
    optional: true
  },
  workflow: {
    type: String,
    optional: true
  },
  layout: {
    type: String,
    optional: true
  },
  triggersEnter: {
    label: "Trigger on Entry",
    type: [String],
    optional: true
  },
  triggersExit: {
    label: "Trigger on Exit",
    type: [String],
    optional: true
  },
  options: {
    label: "Routing Options",
    type: Object,
    optional: true
  },
  description: {
    type: String,
    optional: true
  },
  icon: {
    type: String,
    optional: true
  },
  label: {
    type: String,
    optional: true
  },
  container: {
    type: String,
    optional: true
  },
  priority: {
    type: Number,
    optional: true
  },
  enabled: {
    type: Boolean,
    optional: true
  },
  permissions: {
    type: [Permissions],
    optional: true
  },
  audience: {
    type: [String],
    optional: true,
    label: "Audience"
  },
  meta: {
    label: "Meta",
    type: Object,
    optional: true,
    blackbox: true
  }
});

/**
 * PackageConfig Schema
 */
var PackageConfig = exports.PackageConfig = new _aldeedSimpleSchema.SimpleSchema({
  shopId: {
    type: String,
    index: 1,
    // see: https://github.com/reactioncommerce/reaction/issues/646#issuecomment-169351842
    // autoValue: shopIdAutoValue,
    label: "PackageConfig ShopId",
    optional: true
  },
  name: {
    type: String,
    index: 1
  },
  enabled: {
    type: Boolean,
    defaultValue: true
  },
  icon: {
    type: String,
    optional: true
  },
  settings: {
    type: Object,
    optional: true,
    blackbox: true
  },
  registry: {
    type: [Registry],
    optional: true
  },
  layout: {
    type: [_layouts.Layout],
    optional: true
  }
});

/**
 * CorePackageConfig Schema
 * Core Reaction Settings
 */

var CorePackageConfig = exports.CorePackageConfig = new _aldeedSimpleSchema.SimpleSchema([PackageConfig, {
  "settings.mail": {
    type: Object,
    optional: true,
    label: "Mail Settings"
  },
  "settings.mail.user": {
    type: String,
    label: "Username"
  },
  "settings.mail.password": {
    type: String,
    label: "Password"
  },
  "settings.mail.host": {
    type: String,
    label: "Host"
  },
  "settings.mail.port": {
    type: String,
    label: "Port"
  },
  "settings.openexchangerates.appId": {
    type: String,
    label: "Open Exchange Rates App Id"
  },
  "settings.openexchangerates.refreshPeriod": {
    type: String,
    label: "Open Exchange Rates refresh period",
    defaultValue: "every 1 hour"
  },
  "settings.google.clientId": {
    type: String,
    label: "Google Client Id",
    defaultValue: null
  },
  "settings.google.apiKey": {
    type: String,
    label: "Google Api Key",
    defaultValue: null
  },
  "settings.public": {
    type: Object,
    optional: true
  },
  "settings.public.allowGuestCheckout": {
    type: Boolean,
    label: "Allow Guest Checkout"
  },
  "settings.cart.cleanupDurationDays": {
    type: String,
    label: "Cleanup Schedule",
    defaultValue: "older than 3 days"
  }
}]);