"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPkgData = undefined;

exports.default = function () {
  var examplePaymentMethodPackage = {
    name: "example-paymentmethod",
    icon: "fa fa-credit-card-alt",
    shopId: (0, _shops.getShopId)(),
    enabled: true,
    settings: {
      "mode": false,
      "apikey": "",
      "example": {
        enabled: false
      },
      "example-paymentmethod": {
        enabled: true,
        support: ["Authorize", "Capture", "Refund"]
      }
    },
    registry: [],
    layout: null
  };

  _dburlesFactory.Factory.define("examplePaymentPackage", _collections.Packages, Object.assign({}, examplePaymentMethodPackage));
};

var _dburlesFactory = require("meteor/dburles:factory");

var _collections = require("/lib/collections");

var _shops = require("./shops");

var getPkgData = exports.getPkgData = function getPkgData(pkgName) {
  var pkgData = _collections.Packages.findOne({
    name: pkgName
  });
  return pkgData;
};