"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Shop = exports.BrandAsset = exports.ShopTheme = exports.Languages = exports.Locale = exports.Currency = exports.CustomEmailSettings = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var _accounts = require("./accounts");

var _address = require("./address");

var _layouts = require("./layouts");

var _metafield = require("./metafield");

/**
 * CustomEmailSettings Schema
 */
var CustomEmailSettings = exports.CustomEmailSettings = new _aldeedSimpleSchema.SimpleSchema({
  service: {
    type: String,
    optional: true
  },
  username: {
    type: String,
    optional: true
  },
  password: {
    type: String,
    optional: true
  },
  host: {
    type: String,
    optional: true
  },
  port: {
    type: Number,
    optional: true
  }
});

/**
 * Currency Schema
 */
var Currency = exports.Currency = new _aldeedSimpleSchema.SimpleSchema({
  symbol: {
    type: String,
    defaultValue: "$"
  },
  format: {
    type: String,
    defaultValue: "%s%v"
  },
  scale: {
    type: Number,
    defaultValue: 2,
    optional: true
  },
  decimal: {
    type: String,
    defaultValue: ".",
    optional: true
  },
  thousand: {
    type: String,
    defaultValue: ",",
    optional: true
  },
  rate: {
    type: Number,
    optional: true
  }
});

/**
 * Locale Schema
 */
var Locale = exports.Locale = new _aldeedSimpleSchema.SimpleSchema({
  continents: {
    type: Object,
    blackbox: true
  },
  countries: {
    type: Object,
    blackbox: true
  }
});

/**
 * Languages Schema
 */

var Languages = exports.Languages = new _aldeedSimpleSchema.SimpleSchema({
  label: {
    type: String
  },
  i18n: {
    type: String
  },
  enabled: {
    type: Boolean,
    defaultValue: true
  }
});

/**
 * ShopTheme Schema
 */
var ShopTheme = exports.ShopTheme = new _aldeedSimpleSchema.SimpleSchema({
  themeId: {
    type: String
  },
  styles: {
    type: String,
    optional: true
  }
});

/**
 * Shop Theme Schema
 */
var BrandAsset = exports.BrandAsset = new _aldeedSimpleSchema.SimpleSchema({
  mediaId: {
    type: String,
    optional: true
  },
  type: {
    type: String,
    optional: true
  }
});

/**
 * Shop Schema
 */
var Shop = exports.Shop = new _aldeedSimpleSchema.SimpleSchema({
  "_id": {
    type: String,
    optional: true
  },
  "status": {
    type: String,
    defaultValue: "active"
  },
  "name": {
    type: String,
    index: 1
  },
  "description": {
    type: String,
    optional: true
  },
  "keywords": {
    type: String,
    optional: true
  },
  "addressBook": {
    type: [_address.Address],
    optional: true
  },
  "domains": {
    type: [String],
    defaultValue: ["localhost"],
    index: 1
  },
  "emails": {
    type: [_accounts.Email],
    optional: true
  },
  "defaultPaymentMethod": {
    label: "Default Payment Method",
    type: String,
    defaultValue: "none"
  },
  "currency": {
    label: "Base Currency",
    type: String,
    defaultValue: "USD"
  },
  "currencies": {
    type: Object, // Schemas.Currency
    blackbox: true,
    optional: true
  },
  "locales": {
    type: Locale
  },
  "language": {
    label: "Base Language",
    type: String,
    defaultValue: "en"
  },
  "languages": {
    type: [Languages],
    optional: true
  },
  "public": {
    type: String,
    optional: true
  },
  "timezone": {
    label: "Timezone",
    type: String,
    defaultValue: "US/Pacific"
  },
  "baseUOM": {
    type: String,
    optional: true,
    defaultValue: "OZ",
    label: "Base Unit of Measure"
  },
  "unitsOfMeasure": {
    type: [Object]
  },
  "unitsOfMeasure.$.uom": {
    type: String,
    defaultValue: "OZ"
  },
  "unitsOfMeasure.$.label": {
    type: String,
    defaultValue: "Ounces"
  },
  "unitsOfMeasure.$.default": {
    type: Boolean,
    defaultValue: false
  },
  "metafields": {
    type: [_metafield.Metafield],
    optional: true
  },
  "defaultVisitorRole": {
    type: [String],
    defaultValue: ["anonymous", "guest", "product", "tag", "index", "cart/checkout", "cart/completed"]
  },
  "defaultRoles": {
    type: [String],
    defaultValue: ["guest", "account/profile", "product", "tag", "index", "cart/checkout", "cart/completed"]
  },
  "layout": {
    type: [_layouts.Layout],
    optional: true
  },
  "theme": {
    type: ShopTheme,
    optional: true
  },
  "brandAssets": {
    type: [BrandAsset],
    optional: true
  },
  "appVersion": {
    type: String,
    optional: true
  },
  "createdAt": {
    type: Date,
    autoValue: function autoValue() {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return {
          $setOnInsert: new Date()
        };
      }
      this.unset();
    },
    denyUpdate: true,
    optional: true
  },
  "updatedAt": {
    type: Date,
    autoValue: function autoValue() {
      if (this.isUpdate) {
        return new Date();
      }
    },
    optional: true
  }
});