"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  // load fixture data
  (0, _loadData2.default)();
  // initialize Reaction
  _api.Reaction.init();
  // we've finished all reaction core initialization
  _api.Logger.info("Reaction initialization finished.");
};

var _api = require("/server/api");

var _loadData = require("./load-data");

var _loadData2 = _interopRequireDefault(_loadData);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }