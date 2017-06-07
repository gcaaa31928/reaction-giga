"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _nodemailerWellknown = require("nodemailer-wellknown");

var _nodemailerWellknown2 = _interopRequireDefault(_nodemailerWellknown);

var _meteor = require("meteor/meteor");

var _check = require("meteor/check");

var _collections = require("/lib/collections");

var _api = require("/server/api");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_meteor.Meteor.methods({
  /**
   * Verify the current email configuration
   * @param {Object} settings - optional settings object (otherwise uses settings in database)
   * @return {Boolean} - returns true if SMTP connection succeeds
   */
  "email/verifySettings": function emailVerifySettings(settings) {
    if (!_api.Reaction.hasPermission(["owner", "admin", "dashboard"], this.userId)) {
      _api.Logger.error("email/verifySettings: Access Denied");
      throw new _meteor.Meteor.Error("access-denied", "Access Denied");
    }

    this.unblock();

    (0, _check.check)(settings, _check.Match.Optional(Object));

    var config = void 0;

    // if a settings object has been provided, build a config
    if ((typeof settings === "undefined" ? "undefined" : _typeof(settings)) === "object") {
      var service = settings.service,
          host = settings.host,
          port = settings.port,
          user = settings.user,
          password = settings.password;


      if (service === "custom" && host && port && user && password) {
        // create a custom Nodemailer config
        config = { host: host, port: port, auth: { user: user, pass: password } };
      } else if (service && user && password) {
        // create a Nodemailer config from the nodemailer-wellknown services
        config = (0, _nodemailerWellknown2.default)(service) || {};
        config.auth = { user: user, pass: password };
      }
    }

    var Email = _api.Reaction.Email;


    try {
      return _meteor.Meteor.wrapAsync(Email.verifyConfig)(config || Email.getMailConfig());
    } catch (e) {
      _api.Logger.error(e);
      throw new _meteor.Meteor.Error(e.responseCode, e.response);
    }
  },


  /**
   * Save new email configuration
   * @param {Object} settings - mail provider settings
   * @return {Boolean} - returns true if update succeeds
   */
  "email/saveSettings": function emailSaveSettings(settings) {
    if (!_api.Reaction.hasPermission(["owner", "admin", "dashboard"], this.userId)) {
      _api.Logger.error("email/saveSettings: Access Denied");
      throw new _meteor.Meteor.Error("access-denied", "Access Denied");
    }

    (0, _check.check)(settings, {
      service: String,
      host: _check.Match.Optional(String),
      port: _check.Match.Optional(Number),
      user: String,
      password: String
    });

    _collections.Packages.update({ name: "core", shopId: _api.Reaction.getShopId() }, {
      $set: {
        "settings.mail": settings
      }
    });

    delete settings.password;

    _api.Logger.info(settings, "Email settings updated");

    return true;
  },


  /**
   * Retry a failed or cancelled email job
   * @param {String} jobId - a sendEmail job ID
   * @return {Boolean} - returns true if job is successfully restarted
   */
  "emails/retryFailed": function emailsRetryFailed(jobId) {
    if (!_api.Reaction.hasPermission(["owner", "admin", "dashboard"], this.userId)) {
      _api.Logger.error("email/retryFailed: Access Denied");
      throw new _meteor.Meteor.Error("access-denied", "Access Denied");
    }

    (0, _check.check)(jobId, String);

    _api.Logger.debug("emails/retryFailed - restarting email job \"" + jobId + "\"");

    _collections.Jobs.update({ _id: jobId }, {
      $set: {
        status: "ready"
      }
    });

    return true;
  }
});