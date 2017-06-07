"use strict";

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _map2 = require("lodash/map");

var _map3 = _interopRequireDefault(_map2);

var _meteor = require("meteor/meteor");

var _check = require("meteor/check");

var _accountsBase = require("meteor/accounts-base");

var _api = require("/server/api");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_meteor.Meteor.methods({
  "accounts/sendResetPasswordEmail": function accountsSendResetPasswordEmail(options) {
    (0, _check.check)(options, {
      email: String
    });

    var user = _accountsBase.Accounts.findUserByEmail(options.email);

    if (!user) {
      _api.Logger.error("accounts/sendResetPasswordEmail - User not found");
      throw new _meteor.Meteor.Error("user-not-found", "User not found");
    }

    var emails = (0, _map3.default)(user.emails || [], "address");

    var caseInsensitiveEmail = (0, _find3.default)(emails, function (email) {
      return email.toLowerCase() === options.email.toLowerCase();
    });

    _api.Reaction.Accounts.sendResetPasswordEmail(user._id, caseInsensitiveEmail);
  }
});