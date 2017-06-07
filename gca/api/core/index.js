"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _core = require("./core");

var _core2 = _interopRequireDefault(_core);

var _accounts = require("./accounts");

var Accounts = _interopRequireWildcard(_accounts);

var _addDefaultRoles = require("./addDefaultRoles");

var AddDefaultRoles = _interopRequireWildcard(_addDefaultRoles);

var _assignRoles = require("./assignRoles");

var AssignRoles = _interopRequireWildcard(_assignRoles);

var _email = require("./email");

var Email = _interopRequireWildcard(_email);

var _import = require("./import");

var Import = _interopRequireWildcard(_import);

var _loadSettings = require("./loadSettings");

var LoadSettings = _interopRequireWildcard(_loadSettings);

var _logger = require("../logger");

var _logger2 = _interopRequireDefault(_logger);

var _router = require("../router");

var _router2 = _interopRequireDefault(_router);

var _setDomain = require("./setDomain");

var SetDomain = _interopRequireWildcard(_setDomain);

var _shopName = require("./shopName");

var ShopName = _interopRequireWildcard(_shopName);

var _ui = require("./ui");

var UI = _interopRequireWildcard(_ui);

var _utils = require("./utils");

var Utils = _interopRequireWildcard(_utils);

var _collections = require("/lib/collections");

var Collections = _interopRequireWildcard(_collections);

var _schemas = require("/lib/collections/schemas");

var Schemas = _interopRequireWildcard(_schemas);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Reaction methods (server)
 */
var Reaction = Object.assign({}, _core2.default, { Accounts: Accounts }, AddDefaultRoles, AssignRoles, { Collections: Collections }, { Email: Email }, Import, LoadSettings, { Log: _logger2.default }, { Router: _router2.default }, { Schemas: Schemas }, SetDomain, ShopName, UI, Utils);

exports.default = Reaction;