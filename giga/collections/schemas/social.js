"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SocialPackageConfig = exports.SocialProvider = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var _registry = require("./registry");

/*
 * Settings for Social Package
 */
var SocialProvider = exports.SocialProvider = new _aldeedSimpleSchema.SimpleSchema({
  profilePage: {
    type: String,
    regEx: _aldeedSimpleSchema.SimpleSchema.RegEx.Url,
    label: "Profile Page",
    optional: true
  },
  enabled: {
    type: Boolean,
    label: "Enabled",
    defaultValue: false,
    optional: true
  }
});

var SocialPackageConfig = exports.SocialPackageConfig = new _aldeedSimpleSchema.SimpleSchema([_registry.PackageConfig, {
  "settings.public": {
    type: Object,
    optional: true
  },
  "settings.public.apps": {
    type: Object,
    label: "Social Settings",
    optional: true
  },
  "settings.public.apps.facebook": {
    type: SocialProvider,
    optional: true
  },
  "settings.public.apps.facebook.appId": {
    type: String,
    regEx: /\d+/,
    label: "App Id",
    optional: true
  },
  "settings.public.apps.facebook.appSecret": {
    type: String,
    regEx: /[\da-z]+/,
    label: "App Secret",
    optional: true
  },
  "settings.public.apps.twitter": {
    type: SocialProvider,
    optional: true
  },
  "settings.public.apps.twitter.username": {
    type: String,
    label: "Username",
    optional: true
  },
  "settings.public.apps.pinterest": {
    type: SocialProvider,
    optional: true
  },
  "settings.public.apps.googleplus": {
    type: SocialProvider,
    label: "Google+",
    optional: true
  }
}]);