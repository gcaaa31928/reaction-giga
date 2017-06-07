"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  _api.Reaction.registerPackage({
    label: "Router",
    name: "reaction-router",
    icon: "fa fa-share-square-o",
    autoEnable: true,
    settings: {
      name: "Layout"
    },
    registry: [{
      provides: "dashboard",
      label: "Routing",
      description: "Routing utilities",
      icon: "fa fa-share-square-o",
      priority: 1,
      container: "utilities"
    }]
  });
};

var _api = require("/server/api");