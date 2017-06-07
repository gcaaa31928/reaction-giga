"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.getShopId = getShopId;
exports.getShopName = getShopName;
exports.getShopPrefix = getShopPrefix;
exports.getAbsoluteUrl = getAbsoluteUrl;
exports.getCurrentTag = getCurrentTag;
exports.getSlug = getSlug;
exports.toCamelCase = toCamelCase;
exports.translateRegistry = translateRegistry;
exports.isObject = isObject;
exports.mergeDeep = mergeDeep;

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _transliteration = require("transliteration");

var _meteor = require("meteor/meteor");

var _lib = require("/imports/plugins/core/router/lib");

var _collections = require("/lib/collections");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * getShopId
 * @return {String} returns current shopId
 */
function getShopId() {
  var domain = _url2.default.parse(_meteor.Meteor.absoluteUrl()).hostname;

  var shop = _collections.Shops.find({ domains: { $in: [domain] } }, {
    limit: 1
  }).fetch()[0];

  return !!shop ? shop._id : null;
}

/**
 * getShopName
 * @return {String} returns current shop name
 */
function getShopName() {
  var domain = _url2.default.parse(_meteor.Meteor.absoluteUrl()).hostname;

  var shop = _collections.Shops.find({ domains: { $in: [domain] } }, {
    limit: 1
  }).fetch()[0];

  return !!shop ? shop.name : null;
}

/**
 * getShopPrefix
 * @param {String} leading - Default "/", prefix, the prefix with a leading shash
 * @return {String} returns shop url prefix
 */
function getShopPrefix() {
  var leading = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "/";

  return leading + getSlug(getShopName().toLowerCase());
}

/**
 * getAbsoluteUrl
 * @param {String} path - path to append to absolute Url, path should be prefixed with / if necessary
 * @return {String} returns absolute url (shop prefix + path)
 */
function getAbsoluteUrl(path) {
  var prefix = getShopPrefix("");
  return _meteor.Meteor.absoluteUrl("" + prefix + path);
}

/**
 * getCurrentTag
 * @return {String} returns current tag
 */
function getCurrentTag() {
  if (_lib.Router.getRouteName() === "tag") {
    return _lib.Router.current().params.slug;
  }
  return null;
}

/**
 * getSlug - return a slugified string using "slugify" from transliteration
 * https://www.npmjs.com/package/transliteration
 * @param  {String} slugString - string to slugify
 * @return {String} slugified string
 */
function getSlug(slugString) {
  return slugString ? (0, _transliteration.slugify)(slugString) : "";
}

/**
 * toCamelCase helper for i18n
 * @summary special toCamelCase for converting a string to camelCase for use with i18n keys
 * @param {String} needscamels String to be camel cased.
 * @return {String} camelCased string
 */
function toCamelCase(needscamels) {
  var s = void 0;
  s = needscamels.replace(/([^a-zA-Z0-9_\- ])|^[_0-9]+/g, "").trim().toLowerCase();
  s = s.replace(/([ -]+)([a-zA-Z0-9])/g, function (a, b, c) {
    return c.toUpperCase();
  });
  s = s.replace(/([0-9]+)([a-zA-Z])/g, function (a, b, c) {
    return b + c.toUpperCase();
  });
  return s;
}

/**
 * translateRegistry
 * @summary adds i18n strings to registry object
 * @param {Object} registry registry object
 * @param {Object} [app] complete package object
 * @return {Object} with updated registry
 */
function translateRegistry(registry, app) {
  var registryLabel = "";
  var i18nKey = "";
  // first we check the default place for a label
  if (registry.label) {
    registryLabel = toCamelCase(registry.label);
    i18nKey = "admin." + registry.provides + "." + registryLabel;
    // and if we don"t find it, we are trying to look at first
    // registry entry
  } else if (app && app.registry && app.registry.length && app.registry[0].label) {
    registryLabel = toCamelCase(app.registry[0].label);
    i18nKey = "admin." + app.registry[0].provides + "." + registryLabel;
  }
  registry.i18nKeyLabel = i18nKey + "Label";
  registry.i18nKeyDescription = i18nKey + "Description";
  registry.i18nKeyPlaceholder = i18nKey + "Placeholder";
  registry.i18nKeyTooltip = i18nKey + "Tooltip";
  registry.i18nKeyTitle = i18nKey + "Title";
  // return registry object with added i18n keys
  return registry;
}

/**
 * Simple is object check.
 * @param {Object} item item to check if is an object
 * @returns {boolean} return true if object
 */
function isObject(item) {
  return item && (typeof item === "undefined" ? "undefined" : _typeof(item)) === "object" && !Array.isArray(item) && item !== null;
}

/**
 * Helper for Deep merge two objects.
 * @param {Object} target deep merge into this object
 * @param {Object} source merge this object
 * @returns {Object} return deep merged object
 */
function mergeDeep(target, source) {
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(function (key) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, _defineProperty({}, key, {}));
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, _defineProperty({}, key, source[key]));
      }
    });
  }
  return target;
}