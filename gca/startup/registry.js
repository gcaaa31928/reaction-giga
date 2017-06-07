"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  (0, _index2.default)();

  // initialize shop registry when a new shop is added
  _collections.Shops.find().observe({
    added: function added(doc) {
      _api.Reaction.setShopName(doc);
      _api.Reaction.setDomain();
    },
    removed: function removed() {
      // TODO SHOP REMOVAL CLEANUP FOR #357
    }
  });
};

var _collections = require("/lib/collections");

var _api = require("/server/api");

var _index = require("./registry/index");

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }