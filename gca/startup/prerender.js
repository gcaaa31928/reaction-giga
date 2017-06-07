"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  if (process.env.PRERENDER_TOKEN && process.env.PRERENDER_HOST) {
    _prerenderNode2.default.set("prerenderToken", process.env.PRERENDER_TOKEN);
    _prerenderNode2.default.set("host", process.env.PRERENDER_HOST);
    _prerenderNode2.default.set("protocol", "https");
    _webapp.WebApp.rawConnectHandlers.use(_prerenderNode2.default);
    _api.Logger.info("Prerender Initialization finished.");
  }
};

var _prerenderNode = require("prerender-node");

var _prerenderNode2 = _interopRequireDefault(_prerenderNode);

var _webapp = require("meteor/webapp");

var _api = require("/server/api");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }