"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _includes2 = require("lodash/includes");

var _includes3 = _interopRequireDefault(_includes2);

var _bunyan = require("bunyan");

var _bunyan2 = _interopRequireDefault(_bunyan);

var _bunyanFormat = require("bunyan-format");

var _bunyanFormat2 = _interopRequireDefault(_bunyanFormat);

var _bunyanLoggly = require("bunyan-loggly");

var _bunyanLoggly2 = _interopRequireDefault(_bunyanLoggly);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// configure bunyan logging module for reaction server
// See: https://github.com/trentm/node-bunyan#levels
var levels = ["FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"];

// set stdout log level
var level = process.env.REACTION_LOG_LEVEL || Meteor.settings.REACTION_LOG_LEVEL || "INFO";
var outputMode = "short";

level = level.toUpperCase();

if (!(0, _includes3.default)(levels, level)) {
  level = "INFO";
}

if (level === "TRACE") {
  outputMode = "json";
}

// default console config (stdout)
var streams = [{
  level: level,
  stream: (0, _bunyanFormat2.default)({ outputMode: outputMode })
}];

// Loggly config (only used if configured)
var logglyToken = process.env.LOGGLY_TOKEN;
var logglySubdomain = process.env.LOGGLY_SUBDOMAIN;

if (logglyToken && logglySubdomain) {
  var logglyStream = {
    type: "raw",
    level: process.env.LOGGLY_LOG_LEVEL || "DEBUG",
    stream: new _bunyanLoggly2.default({
      token: logglyToken,
      subdomain: logglySubdomain
    })
  };
  streams.push(logglyStream);
}

// create default logger instance
var Logger = _bunyan2.default.createLogger({
  name: "Reaction",
  streams: streams
});

exports.default = Logger;