"use strict";

require("./methods");

var _startup = require("./startup");

var _startup2 = _interopRequireDefault(_startup);

var _security = require("./security");

var _security2 = _interopRequireDefault(_security);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Meteor.startup(function () {
  (0, _startup2.default)();
  (0, _security2.default)();
});