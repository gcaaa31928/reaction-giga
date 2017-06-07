"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GeoCoder = undefined;

var _collections = require("/lib/collections");

var _api = require("/server/api");

var _http = require("meteor/http");

var _meteor = require("meteor/meteor");

/**
 * meteor-geocoder
 * modifed for reaction core.
 *
 * https://github.com/aldeed/meteor-geocoder
 * The MIT License (MIT)
 * Copyright (c) 2014 Eric Dobbertin
 */

// backwards compatibility
if (typeof _meteor.Meteor.wrapAsync === "undefined") {
  _meteor.Meteor.wrapAsync = _meteor.Meteor._wrapAsync;
}
/* eslint func-style: 1 */
//
// init geocoder
var GeoCoder = exports.GeoCoder = function GeoCoder(options) {
  var extra = void 0;
  var self = undefined;
  // fetch shop settings for api auth credentials
  var shopSettings = _collections.Packages.findOne({
    shopId: _api.Reaction.getShopId(),
    name: "core"
  }, {
    fields: {
      settings: 1
    }
  });

  if (shopSettings) {
    if (shopSettings.settings.google) {
      extra = {
        clientId: shopSettings.settings.google.clientId,
        apiKey: shopSettings.settings.google.apiKey
      };
    }
  }

  self.options = _.extend({
    geocoderProvider: "google",
    httpAdapter: "https",
    extra: extra
  }, options || {});
};

function gc(address, options, callback) {
  var g = require("node-geocoder")(options.geocoderProvider, options.httpAdapter, options.extra);
  g.geocode(address, callback);
}

GeoCoder.prototype.geocode = function geoCoderGeocode(address, callback) {
  var geoCallback = callback;
  var geoAddress = address;
  if (geoCallback) {
    geoCallback = _meteor.Meteor.bindEnvironment(geoCallback, function (error) {
      if (error) throw error;
    });
    gc(geoAddress, this.options, geoCallback);
  } else {
    geoAddress = _meteor.Meteor.wrapAsync(gc)(geoAddress, this.options);
    return geoAddress[0];
  }
};

function rv(lat, lng, options, callback) {
  var g = require("node-geocoder")(options.geocoderProvider, options.httpAdapter, options.extra);
  g.reverse({
    lat: lat,
    lon: lng
  }, callback);
}

GeoCoder.prototype.reverse = function geoCoderReverse(lat, lng, callback) {
  var geoCallback = callback;
  if (geoCallback) {
    geoCallback = _meteor.Meteor.bindEnvironment(geoCallback, function (error) {
      if (error) throw error;
    });
    rv(lat, lng, this.options, geoCallback);
  } else {
    try {
      address = _meteor.Meteor.wrapAsync(rv)(lat, lng, this.options);
      return address[0];
    } catch (_error) {
      return {
        latitude: null,
        longitude: null,
        country: "United States",
        city: null,
        state: null,
        stateCode: null,
        zipcode: null,
        streetName: null,
        streetNumber: null,
        countryCode: "US"
      };
    }
  }
};

function gi(address, callback) {
  var lookupAddress = address;
  // short term solution to an haproxy ssl cert installation issue
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
  // if we're local, let's let freegeoip guess.
  if (lookupAddress === "127.0.0.1" || lookupAddress === null) {
    lookupAddress = "";
  }
  // calls a private reaction hosted version of freegeoip
  _http.HTTP.call("GET", "https://geo.getreaction.io/json/" + lookupAddress, callback);
}

GeoCoder.prototype.geoip = function geoCoderGeocode(address, callback) {
  var geoCallback = callback;
  var geoAddress = address;
  if (geoCallback) {
    geoCallback = _meteor.Meteor.bindEnvironment(geoCallback, function (error) {
      if (error) throw error;
    });
    gi(geoAddress, this.options, geoCallback);
  } else {
    try {
      geoAddress = _meteor.Meteor.wrapAsync(gi)(geoAddress);
      return geoAddress.data;
    } catch (error) {
      _api.Logger.warn("shop/getLocale geoip lookup failure", error);
      return {};
    }
  }
};