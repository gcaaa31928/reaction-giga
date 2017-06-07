"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  _api.Reaction.registerPackage({
    label: "Core",
    name: "core",
    icon: "fa fa-th",
    autoEnable: true,
    settings: {
      public: {
        allowGuestCheckout: true
      },
      mail: {
        user: "",
        password: "",
        host: "",
        port: ""
      },
      openexchangerates: {
        appId: "",
        refreshPeriod: "every 1 hour"
      },
      paymentMethod: {
        defaultPaymentMethod: ""
      }
    },
    layout: [{
      layout: "coreLayout",
      workflow: "coreWorkflow",
      theme: "default",
      enabled: true,
      structure: {
        template: "products",
        layoutHeader: "layoutHeader",
        layoutFooter: "layoutFooter",
        notFound: "productNotFound",
        dashboardControls: "dashboardControls",
        adminControlsFooter: "adminControlsFooter"
      }
    }, {
      layout: "coreLayout",
      workflow: "coreWorkflow",
      theme: "default",
      enabled: true,
      structure: {
        template: "unauthorized",
        layoutHeader: "layoutHeader",
        layoutFooter: "layoutFooter"
      }
    }]
  });
};

var _api = require("/server/api");