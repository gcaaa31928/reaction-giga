"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  (0, _shops2.default)();
  (0, _users2.default)();
  (0, _packages2.default)();
  (0, _accounts2.default)();
  (0, _products2.default)();
  (0, _cart2.default)();
  (0, _orders2.default)();
  // shipping();
};

var _accounts = require("./accounts");

var _accounts2 = _interopRequireDefault(_accounts);

var _cart = require("./cart");

var _cart2 = _interopRequireDefault(_cart);

var _orders = require("./orders");

var _orders2 = _interopRequireDefault(_orders);

var _products = require("./products");

var _products2 = _interopRequireDefault(_products);

var _packages = require("./packages");

var _packages2 = _interopRequireDefault(_packages);

var _shops = require("./shops");

var _shops2 = _interopRequireDefault(_shops);

var _users = require("./users");

var _users2 = _interopRequireDefault(_users);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }