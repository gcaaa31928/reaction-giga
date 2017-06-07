"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _map2 = require("lodash/map");

var _map3 = _interopRequireDefault(_map2);

var _includes2 = require("lodash/includes");

var _includes3 = _interopRequireDefault(_includes2);

exports.sendResetPasswordEmail = sendResetPasswordEmail;
exports.sendVerificationEmail = sendVerificationEmail;

var _meteor = require("meteor/meteor");

var _accountsBase = require("meteor/accounts-base");

var _meteorhacksSsr = require("meteor/meteorhacks:ssr");

var _collections = require("/lib/collections");

var _api = require("/server/api");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Send an email with a link that the user can use to reset their password.
 * @param {String} userId - The id of the user to send email to.
 * @param {String} [optionalEmail] Address to send the email to.
 *                 This address must be in the user's `emails` list.
 *                 Defaults to the first email in the list.
 * @return {Job} - returns a sendEmail Job instance
 */
function sendResetPasswordEmail(userId, optionalEmail) {
  // Make sure the user exists, and email is one of their addresses.
  var user = _meteor.Meteor.users.findOne(userId);

  if (!user) {
    _api.Logger.error("sendResetPasswordEmail - User not found");
    throw new _meteor.Meteor.Error("user-not-found", "User not found");
  }

  var email = optionalEmail;

  // pick the first email if we weren't passed an email.
  if (!optionalEmail && user.emails && user.emails[0]) {
    email = user.emails[0].address;
  }

  // make sure we have a valid email
  if (!email || !(0, _includes3.default)((0, _map3.default)(user.emails || [], "address"), email)) {
    _api.Logger.error("sendResetPasswordEmail - Email not found");
    throw new _meteor.Meteor.Error("email-not-found", "Email not found");
  }

  // Create token for password reset
  var token = Random.secret();
  var when = new Date();
  var tokenObj = { token: token, email: email, when: when };

  _meteor.Meteor.users.update(userId, {
    $set: {
      "services.password.reset": tokenObj
    }
  });

  _meteor.Meteor._ensure(user, "services", "password").reset = tokenObj;

  // Get shop data for email display
  var shop = _collections.Shops.findOne(_api.Reaction.getShopId());

  // Get shop logo, if available. If not, use default logo from file-system
  var emailLogo = void 0;
  if (Array.isArray(shop.brandAssets)) {
    var brandAsset = (0, _find3.default)(shop.brandAssets, function (asset) {
      return asset.type === "navbarBrandImage";
    });
    var mediaId = _collections.Media.findOne(brandAsset.mediaId);
    emailLogo = path.join(_meteor.Meteor.absoluteUrl(), mediaId.url());
  } else {
    emailLogo = _meteor.Meteor.absoluteUrl() + "resources/email-templates/shop-logo.png";
  }

  var dataForEmail = {
    // Shop Data
    shop: shop,
    contactEmail: shop.emails[0].address,
    homepage: _meteor.Meteor.absoluteUrl(),
    emailLogo: emailLogo,
    copyrightDate: moment().format("YYYY"),
    legalName: shop.addressBook[0].company,
    physicalAddress: {
      address: shop.addressBook[0].address1 + " " + shop.addressBook[0].address2,
      city: shop.addressBook[0].city,
      region: shop.addressBook[0].region,
      postal: shop.addressBook[0].postal
    },
    shopName: shop.name,
    socialLinks: {
      display: true,
      facebook: {
        display: true,
        icon: _meteor.Meteor.absoluteUrl() + "resources/email-templates/facebook-icon.png",
        link: "https://www.facebook.com"
      },
      googlePlus: {
        display: true,
        icon: _meteor.Meteor.absoluteUrl() + "resources/email-templates/google-plus-icon.png",
        link: "https://plus.google.com"
      },
      twitter: {
        display: true,
        icon: _meteor.Meteor.absoluteUrl() + "resources/email-templates/twitter-icon.png",
        link: "https://www.twitter.com"
      }
    },
    // Account Data
    passwordResetUrl: _accountsBase.Accounts.urls.resetPassword(token),
    user: user
  };

  // Compile Email with SSR
  var tpl = "accounts/resetPassword";
  var subject = "accounts/resetPassword/subject";
  _meteorhacksSsr.SSR.compileTemplate(tpl, _api.Reaction.Email.getTemplate(tpl));
  _meteorhacksSsr.SSR.compileTemplate(subject, _api.Reaction.Email.getSubject(tpl));

  return _api.Reaction.Email.send({
    to: email,
    from: _api.Reaction.getShopEmail(),
    subject: _meteorhacksSsr.SSR.render(subject, dataForEmail),
    html: _meteorhacksSsr.SSR.render(tpl, dataForEmail)
  });
}

/**
 * Send an email with a link the user can use verify their email address.
 * @param {String} userId - The id of the user to send email to.
 * @param {String} [email] Optional. Address to send the email to.
 *                 This address must be in the user's emails list.
 *                 Defaults to the first unverified email in the list.
 * @return {Job} - returns a sendEmail Job instance
 */
function sendVerificationEmail(userId, email) {
  // Make sure the user exists, and email is one of their addresses.
  var user = _meteor.Meteor.users.findOne(userId);

  if (!user) {
    _api.Logger.error("sendVerificationEmail - User not found");
    throw new _meteor.Meteor.Error("user-not-found", "User not found");
  }

  var address = email;

  // pick the first unverified address if no address provided.
  if (!email) {
    var unverifiedEmail = (0, _find3.default)(user.emails || [], function (e) {
      return !e.verified;
    }) || {};

    address = unverifiedEmail.address;

    if (!address) {
      var msg = "No unverified email addresses found.";
      _api.Logger.error(msg);
      throw new _meteor.Meteor.Error("no-unverified-address", msg);
    }
  }

  // make sure we have a valid address
  if (!address || !(0, _includes3.default)((0, _map3.default)(user.emails || [], "address"), address)) {
    var _msg = "Email not found for user";
    _api.Logger.error(_msg);
    throw new _meteor.Meteor.Error("email-not-found", _msg);
  }

  var token = Random.secret();
  var when = new Date();
  var tokenObj = { token: token, address: address, when: when };

  _meteor.Meteor.users.update({ _id: userId }, {
    $push: {
      "services.email.verificationTokens": tokenObj
    }
  });

  var shopName = _api.Reaction.getShopName();
  var url = _accountsBase.Accounts.urls.verifyEmail(token);

  var dataForEmail = {
    // Reaction Information
    contactEmail: "hello@reactioncommerce.com",
    homepage: _meteor.Meteor.absoluteUrl(),
    emailLogo: _meteor.Meteor.absoluteUrl() + "resources/placeholder.gif",
    copyrightDate: moment().format("YYYY"),
    legalName: "Reaction Commerce",
    physicalAddress: {
      address: "2110 Main Street, Suite 207",
      city: "Santa Monica",
      region: "CA",
      postal: "90405"
    },
    shopName: shopName,
    socialLinks: {
      facebook: {
        link: "https://www.facebook.com/reactioncommerce"
      },
      github: {
        link: "https://github.com/reactioncommerce/reaction"
      },
      instagram: {
        link: "https://instagram.com/reactioncommerce"
      },
      twitter: {
        link: "https://www.twitter.com/getreaction"
      }
    },
    confirmationUrl: url,
    userEmailAddress: address
  };

  if (!_api.Reaction.Email.getMailUrl()) {
    _api.Logger.warn("\n\n  ***************************************************\n          IMPORTANT! EMAIL VERIFICATION LINK\n\n           Email sending is not configured.\n\n  Go to the following URL to verify email: " + address + "\n\n  " + url + "\n  ***************************************************\n\n    ");
  }

  var tpl = "accounts/verifyEmail";
  var subject = "accounts/verifyEmail/subject";

  _meteorhacksSsr.SSR.compileTemplate(tpl, _api.Reaction.Email.getTemplate(tpl));
  _meteorhacksSsr.SSR.compileTemplate(subject, _api.Reaction.Email.getSubject(subject));

  return _api.Reaction.Email.send({
    to: address,
    from: _api.Reaction.getShopEmail(),
    subject: _meteorhacksSsr.SSR.render(subject, dataForEmail),
    html: _meteorhacksSsr.SSR.render(tpl, dataForEmail)
  });
}