"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  (0, _accounts2.default)();
  (0, _i18n2.default)();
  (0, _templates.initTemplates)();
  (0, _packages2.default)();
  (0, _registry2.default)();
  (0, _init2.default)();
  (0, _prerender2.default)();
};

var _accounts = require("./accounts");

var _accounts2 = _interopRequireDefault(_accounts);

var _i18n = require("./i18n");

var _i18n2 = _interopRequireDefault(_i18n);

var _packages = require("./packages");

var _packages2 = _interopRequireDefault(_packages);

var _registry = require("./registry");

var _registry2 = _interopRequireDefault(_registry);

var _init = require("./init");

var _init2 = _interopRequireDefault(_init);

var _prerender = require("./prerender");

var _prerender2 = _interopRequireDefault(_prerender);

var _templates = require("/server/api/core/templates");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }