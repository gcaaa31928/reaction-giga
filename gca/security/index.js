"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  (0, _collections2.default)();
  (0, _rateLimits2.default)();
};

var _collections = require("./collections");

var _collections2 = _interopRequireDefault(_collections);

var _rateLimits = require("./rate-limits");

var _rateLimits2 = _interopRequireDefault(_rateLimits);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }