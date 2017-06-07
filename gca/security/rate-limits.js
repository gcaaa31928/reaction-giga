"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _includes2 = require("lodash/includes");

var _includes3 = _interopRequireDefault(_includes2);

var _ddpRateLimiter = require("meteor/ddp-rate-limiter");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _default() {
  /**
   * Rate limit Meteor Accounts methods
   * 2 attempts per connection per 5 seconds
   */
  var authMethods = ["login", "logout", "logoutOtherClients", "getNewToken", "removeOtherTokens", "configureLoginService", "changePassword", "forgotPassword", "resetPassword", "verifyEmail", "createUser", "ATRemoveService", "ATCreateUserServer", "ATResendVerificationEmail"];

  _ddpRateLimiter.DDPRateLimiter.addRule({
    name: function name(_name) {
      return (0, _includes3.default)(authMethods, _name);
    },
    connectionId: function connectionId() {
      return true;
    }
  }, 2, 5000);

  /**
   * Rate limit "orders/sendNotification"
   * 1 attempt per connection per 2 seconds
   */
  _ddpRateLimiter.DDPRateLimiter.addRule({
    name: "orders/sendNotification",
    connectionId: function connectionId() {
      return true;
    }
  }, 1, 2000);
}
exports.default = _default;