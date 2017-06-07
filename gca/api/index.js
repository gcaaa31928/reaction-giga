"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MethodHooks = exports.Logger = exports.Hooks = exports.GeoCoder = exports.Router = exports.Accounts = exports.Reaction = undefined;

var _core = require("./core");

var _core2 = _interopRequireDefault(_core);

var _accounts = require("./core/accounts");

var Accounts = _interopRequireWildcard(_accounts);

var _router = require("./router");

var _router2 = _interopRequireDefault(_router);

var _geocoder = require("./geocoder");

var _hooks = require("./hooks");

var _hooks2 = _interopRequireDefault(_hooks);

var _logger = require("./logger");

var _logger2 = _interopRequireDefault(_logger);

var _methodHooks = require("./method-hooks");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Legacy globals
// TODO: add deprecation warnings
ReactionCore = _core2.default;
ReactionRouter = _router2.default;
ReactionRegistry = {
  assignOwnerRoles: _core2.default.assignOwnerRoles,
  createDefaultAdminUser: _core2.default.createDefaultAdminUser,
  getRegistryDomain: _core2.default.getRegistryDomain,
  loadPackages: _core2.default.loadPackages,
  loadSettings: _core2.default.loadSettings,
  Packages: _core2.default.Packages,
  setDomain: _core2.default.setDomain,
  setShopName: _core2.default.setShopName
};

exports.Reaction = _core2.default;
exports.Accounts = Accounts;
exports.Router = _router2.default;
exports.GeoCoder = _geocoder.GeoCoder;
exports.Hooks = _hooks2.default;
exports.Logger = _logger2.default;
exports.MethodHooks = _methodHooks.MethodHooks;