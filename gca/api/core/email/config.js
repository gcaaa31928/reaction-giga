"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMailUrl = getMailUrl;
exports.getMailConfig = getMailConfig;
exports.verifyConfig = verifyConfig;

var _nodemailer = require("nodemailer");

var _nodemailer2 = _interopRequireDefault(_nodemailer);

var _nodemailerWellknown = require("nodemailer-wellknown");

var _nodemailerWellknown2 = _interopRequireDefault(_nodemailerWellknown);

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _meteor = require("meteor/meteor");

var _api = require("/server/api");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * getMailUrl - get the smtp URL for sending emails
 * There are 3 possible ways to set the email configuration and
 * the first value found will be used.
 * The priority order is:
 *   1. MAIL_URL environment variable
 *   2. Meteor settings (MAIL_URL key)
 *   3. Core shop settings from the database
 * @return {String} returns an SMTP url if one of the settings have been set
 */
function getMailUrl() {
  var shopSettings = _api.Reaction.getShopSettings();

  var shopMail = void 0;

  if (shopSettings) {
    shopMail = shopSettings.mail || {};
  }

  // get all possible mail settings
  var processUrl = process.env.MAIL_URL;
  var settingsUrl = _meteor.Meteor.settings.MAIL_URL;
  var _shopMail = shopMail,
      service = _shopMail.service,
      user = _shopMail.user,
      password = _shopMail.password,
      host = _shopMail.host,
      port = _shopMail.port;


  var mailString = void 0;

  // create a mail url from well-known provider settings (if they exist)
  // https://github.com/nodemailer/nodemailer-wellknown
  if (service && service !== "custom" && user && password) {
    var conf = (0, _nodemailerWellknown2.default)(service);

    if (conf) {
      // account for local test providers like Maildev
      if (!conf.host) {
        mailString = "smtp://localhost:" + conf.port;
      } else {
        mailString = "smtp://" + encodeURIComponent(user) + ":" + password + "@" + conf.host + ":" + conf.port;
      }
    }
  }

  // create a mail url from custom provider settings (if they exist)
  if ((!service || service === "custom") && user && password && host && port) {
    mailString = "smtp://" + encodeURIComponent(user) + ":" + password + "@" + host + ":" + port;
  }

  // create the final url from the available options
  var mailUrl = processUrl || settingsUrl || mailString;

  if (!mailUrl) {
    _api.Logger.warn("Reaction.Email.getMailUrl() - no email provider configured");
    return null;
  }

  return mailUrl;
}

/**
 * getMailConfig - get the email sending config for Nodemailer
 * @return {{host: String, port: Number, secure: Boolean, auth: Object, logger: Boolean}} returns a config object
 */
function getMailConfig() {
  var processUrl = process.env.MAIL_URL;
  var settingsUrl = _meteor.Meteor.settings.MAIL_URL;

  var mailString = processUrl || settingsUrl;

  // if MAIL_URL or Meteor settings have been used,
  // parse the URL and create a config object
  if (mailString) {
    // parse the url
    var parsedUrl = _url2.default.parse(mailString);
    var creds = parsedUrl.auth.split(":");
    parsedUrl.port = Number(parsedUrl.port);

    _api.Logger.debug("Using " + parsedUrl.hostname + " to send email");

    // create a nodemailer config from the SMTP url string
    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port,
      // since the port is casted to number above
      secure: parsedUrl.port === 465,
      auth: {
        user: creds[0],
        pass: creds[1]
      },
      logger: process.env.EMAIL_DEBUG === "true"
    };
  }

  // check for mail settings in the database
  var shopSettings = _api.Reaction.getShopSettings();

  var shopMail = void 0;

  if (shopSettings) {
    shopMail = shopSettings.mail || {};
  }

  var _shopMail2 = shopMail,
      service = _shopMail2.service,
      user = _shopMail2.user,
      password = _shopMail2.password,
      host = _shopMail2.host,
      port = _shopMail2.port;

  // if a service provider preset was chosen, return a Nodemailer config for it
  // https://github.com/nodemailer/nodemailer-wellknown

  if (service && service !== "custom" && user && password) {
    _api.Logger.debug("Using " + service + " to send email");

    // get the config from nodemailer-wellknown
    var conf = (0, _nodemailerWellknown2.default)(service);

    // account for local test providers like Maildev with no auth
    if (!conf.host) {
      return conf;
    }

    // add the credentials to the config
    conf.auth = { user: user, pass: password };

    return conf;
  }

  // if a custom config was chosen and all necessary fields exist in the database,
  // return the custom Nodemailer config
  if ((!service || service === "custom") && user && password && host && port) {
    _api.Logger.debug("Using " + host + " to send email");

    return {
      host: host,
      port: port,
      secure: port === 465,
      auth: { user: user, pass: password },
      logger: process.env.EMAIL_DEBUG === "true"
    };
  }

  // else, return the direct mail config and a warning
  _api.Logger.warn("\n    Mail service not configured. Attempting to use direct sending option.\n    The mail may send, but messages are far more likely go to the user's spam folder.\n    Please configure an SMTP mail sending provider.\n  ");

  return {
    direct: true,
    logger: process.env.EMAIL_DEBUG === "true"
  };
}

/**
 * Verify a transporter configuration works
 * https://github.com/nodemailer/nodemailer#verify-smtp-connection-configuration
 * @param {Object} config - a Nodemailer transporter config object
 * @param {Function} callback - optional callback with standard error/result args
 * @return {Promise} returns a Promise if no callback is provided
 */
function verifyConfig(config, callback) {
  var transporter = _nodemailer2.default.createTransport(config);
  return transporter.verify(callback);
}