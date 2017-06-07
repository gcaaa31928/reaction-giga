"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = function () {
  /**
   * Make sure initial admin user has verified their
   * email before allowing them to login.
   *
   * http://docs.meteor.com/#/full/accounts_validateloginattempt
   */

  Accounts.validateLoginAttempt(function (attempt) {
    if (!attempt.allowed) {
      return false;
    }

    // confirm this is the accounts-password login method
    if (attempt.type !== "password" || attempt.methodName !== "login") {
      return attempt.allowed;
    }

    if (!attempt.user) {
      return attempt.allowed;
    }

    var loginEmail = attempt.methodArguments[0].user.email;
    var adminEmail = process.env.REACTION_EMAIL;

    if (loginEmail && loginEmail === adminEmail) {
      // filter out the matching login email from any existing emails
      var userEmail = _.filter(attempt.user.emails, function (email) {
        return email.address === loginEmail;
      });

      // check if the email is verified
      if (!userEmail.length || !userEmail[0].verified) {
        throw new _meteor.Meteor.Error("403", "Oops! Please validate your email first.");
      }
    }

    return attempt.allowed;
  });

  /**
   * Reaction Accounts handlers
   * creates a login type "anonymous"
   * default for all unauthenticated visitors
   */
  Accounts.registerLoginHandler(function (options) {
    if (!options.anonymous) {
      return {};
    }
    var stampedToken = Accounts._generateStampedLoginToken();
    var userId = Accounts.insertUserDoc({
      services: {
        anonymous: true
      },
      token: stampedToken.token
    });
    var loginHandler = {
      type: "anonymous",
      userId: userId
    };
    return loginHandler;
  });

  /**
   * Accounts.onCreateUser event
   * adding either a guest or anonymous role to the user on create
   * adds Accounts record for reaction user profiles
   * we clone the user into accounts, as the user collection is
   * only to be used for authentication.
   * - defaultVisitorRole
   * - defaultRoles
   * can be overriden from Shops
   *
   * @see: http://docs.meteor.com/#/full/accounts_oncreateuser
   */
  Accounts.onCreateUser(function (options, user) {
    var shop = _api.Reaction.getCurrentShop();
    var shopId = shop._id;
    var defaultVisitorRole = ["anonymous", "guest", "product", "tag", "index", "cart/checkout", "cart/completed"];
    var defaultRoles = ["guest", "account/profile", "product", "tag", "index", "cart/checkout", "cart/completed"];
    var roles = {};
    var additionals = {
      profile: Object.assign({}, options && options.profile)
    };
    if (!user.emails) user.emails = [];
    // init default user roles
    // we won't create users unless we have a shop.
    if (shop) {
      // retain language when user has defined a language
      // perhaps should be treated as additionals
      // or in onLogin below, or in the anonymous method options
      if (!(_meteor.Meteor.users.find().count() === 0)) {
        // dont set on inital admin
        if (!user.profile) user.profile = {};
        var currentUser = _meteor.Meteor.user(user);
        if (currentUser && currentUser.profile) {
          if (currentUser.profile.lang && !user.profile.lang) {
            user.profile.lang = currentUser.profile.lang;
          }
          if (currentUser.profile.currency && !user.profile.currency) {
            user.profile.currency = currentUser.profile.currency;
          }
        }
      }

      // if we don't have user.services we're an anonymous user
      if (!user.services) {
        roles[shopId] = shop.defaultVisitorRole || defaultVisitorRole;
      } else {
        roles[shopId] = shop.defaultRoles || defaultRoles;
        // also add services with email defined to user.emails[]
        for (var service in user.services) {
          if (user.services[service].email) {
            var email = {
              provides: "default",
              address: user.services[service].email,
              verified: true
            };
            user.emails.push(email);
          }
          if (user.services[service].name) {
            user.username = user.services[service].name;
            additionals.profile.name = user.services[service].name;
          }
          // TODO: For now we have here instagram, twitter and google avatar cases
          // need to make complete list
          if (user.services[service].picture) {
            additionals.profile.picture = user.services[service].picture;
          } else if (user.services[service].profile_image_url_https) {
            additionals.profile.picture = user.services[service].dprofile_image_url_https;
          } else if (user.services[service].profile_picture) {
            additionals.profile.picture = user.services[service].profile_picture;
          }
        }
      }
      // clone before adding roles
      var account = Object.assign({}, user, additionals);
      account.userId = user._id;
      Collections.Accounts.insert(account);

      // send a welcome email to new users,
      // but skip the first default admin user
      // (default admins already get a verification email)
      if (!(_meteor.Meteor.users.find().count() === 0)) {
        _meteor.Meteor.call("accounts/sendWelcomeEmail", shopId, user._id);
      }

      // assign default user roles
      user.roles = roles;

      // run onCreateUser hooks
      // (the user object must be returned by all callbacks)
      var userDoc = _api.Hooks.Events.run("onCreateUser", user, options);
      return userDoc;
    }
  });

  /**
   * Accounts.onLogin event
   * let's remove "anonymous" role, if the login type isn't "anonymous"
   * @param {Object} options - user account creation options
   * @fires "cart/mergeCart" Method
   */
  Accounts.onLogin(function (opts) {
    // run onLogin hooks
    // (the options object must be returned by all callbacks)
    options = _api.Hooks.Events.run("onLogin", opts);

    // remove anonymous role
    // all users are guest, but anonymous user don't have profile access
    // or ability to order history, etc. so ensure its removed upon login.
    if (options.type !== "anonymous" && options.type !== "resume") {
      var update = {
        $pullAll: {}
      };

      update.$pullAll["roles." + _api.Reaction.getShopId()] = ["anonymous"];

      _meteor.Meteor.users.update({
        _id: options.user._id
      }, update, {
        multi: true
      });
      // debug info
      _api.Logger.debug("removed anonymous role from user: " + options.user._id);

      // do not call `cart/mergeCart` on methodName === `createUser`, because
      // in this case `cart/mergeCart` calls from cart publication
      if (options.methodName === "createUser") return true;

      // onLogin, we want to merge session cart into user cart.
      var cart = Collections.Cart.findOne({
        userId: options.user._id
      });

      // for a rare use cases
      if ((typeof cart === "undefined" ? "undefined" : _typeof(cart)) !== "object") return false;
      // in current version currentSessionId will be available for anonymous
      // users only, because it is unknown for me how to pass sessionId when user
      // logged in
      var currentSessionId = options.methodArguments && options.methodArguments.length === 1 && options.methodArguments[0].sessionId;

      // changing of workflow status from now happens within `cart/mergeCart`
      return _meteor.Meteor.call("cart/mergeCart", cart._id, currentSessionId);
    }
  });
};

var _meteor = require("meteor/meteor");

var _collections = require("/lib/collections");

var Collections = _interopRequireWildcard(_collections);

var _api = require("/server/api");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }