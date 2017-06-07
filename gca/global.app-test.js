"use strict";

var _meteor = require("meteor/meteor");

var _collections = require("/lib/collections");

var _api = require("/server/api");

before(function () {
  this.timeout(6000);
  var numPackages = 0;
  while (numPackages === 0) {
    numPackages = _collections.Packages.find({}).count();
    _api.Logger.debug("there are " + numPackages + " packages loaded");
    _meteor.Meteor._sleepForMs(500);
  }
});