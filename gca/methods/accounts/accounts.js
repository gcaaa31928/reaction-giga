"use strict";

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _upperCase2 = require("lodash/upperCase");

var _upperCase3 = _interopRequireDefault(_upperCase2);

var _trim2 = require("lodash/trim");

var _trim3 = _interopRequireDefault(_trim2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _includes2 = require("lodash/includes");

var _includes3 = _interopRequireDefault(_includes2);

var _filter2 = require("lodash/filter");

var _filter3 = _interopRequireDefault(_filter2);

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _moment = require("moment");

var _moment2 = _interopRequireDefault(_moment);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _accountsBase = require("meteor/accounts-base");

var _collections = require("/lib/collections");

var _schemas = require("/lib/collections/schemas");

var Schemas = _interopRequireWildcard(_schemas);

var _api = require("/server/api");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @summary Returns the name of the geocoder method to use
 * @returns {string} Name of the Geocoder method to use
 */
function getValidator() {
  var shopId = _api.Reaction.getShopId();
  var geoCoders = _collections.Packages.find({
    "registry.provides": "addressValidation",
    "settings.addressValidation.enabled": true,
    "shopId": shopId,
    "enabled": true
  }).fetch();

  if (!geoCoders.length) {
    return "";
  }
  var geoCoder = void 0;
  // Just one?, use that one
  if (geoCoders.length === 1) {
    geoCoder = geoCoders[0];
  }
  // If there are two, we default to the one that is not the Reaction one
  if (geoCoders.length === 2) {
    geoCoder = (0, _filter3.default)(geoCoders, function (coder) {
      return !(0, _includes3.default)(coder.name, "reaction");
    })[0];
  }

  // check if addressValidation is enabled but the package is disabled, don't do address validation
  var registryName = void 0;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = geoCoder.registry[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var registry = _step.value;

      if (registry.provides === "addressValidation") {
        registryName = registry.name;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var packageKey = registryName.split("/")[2]; // "taxes/addressValidation/{packageKey}"
  if (!(0, _get3.default)(geoCoder.settings[packageKey], "enabled")) {
    return "";
  }

  var methodName = geoCoder.settings.addressValidation.addressValidationMethod;
  return methodName;
}

/**
 * @summary Compare individual fields of address and accumulate errors
 * @param {Object} address - the address provided by the customer
 * @param {Object} validationAddress - address provided by validator
 * @returns {Array} Array of errors (or empty)
 */
function compareAddress(address, validationAddress) {
  var errors = [];
  // first check, if a field is missing (and was present in original address), that means it didn't validate
  // TODO rewrite with just a loop over field names but KISS for now
  if (address.address1 && !validationAddress.address1) {
    errors.push({ address1: "Address line one did not validate" });
  }

  if (address.address2 && validationAddress.address2 && (0, _trim3.default)((0, _upperCase3.default)(address.address2)) !== (0, _trim3.default)((0, _upperCase3.default)(validationAddress.address2))) {
    errors.push({ address2: "Address line 2 did not validate" });
  }

  if (!validationAddress.city) {
    errors.push({ city: "City did not validate" });
  }
  if (address.postal && !validationAddress.postal) {
    errors.push({ postal: "Postal did not validate" });
  }

  if (address.region && !validationAddress.region) {
    errors.push({ region: "Region did not validate" });
  }

  if (address.country && !validationAddress.country) {
    errors.push({ country: "Country did not validate" });
  }
  // second check if both fields exist, but they don't match (which almost always happen for certain fields on first time)
  if (validationAddress.address1 && address.address1 && (0, _trim3.default)((0, _upperCase3.default)(address.address1)) !== (0, _trim3.default)((0, _upperCase3.default)(validationAddress.address1))) {
    errors.push({ address1: "Address line 1 did not match" });
  }

  if (validationAddress.address2 && address.address2 && (0, _upperCase3.default)(address.address2) !== (0, _upperCase3.default)(validationAddress.address2)) {
    errors.push({ address2: "Address line 2" });
  }

  if (validationAddress.city && address.city && (0, _trim3.default)((0, _upperCase3.default)(address.city)) !== (0, _trim3.default)((0, _upperCase3.default)(validationAddress.city))) {
    errors.push({ city: "City did not match" });
  }

  if (validationAddress.postal && address.postal && (0, _trim3.default)((0, _upperCase3.default)(address.postal)) !== (0, _trim3.default)((0, _upperCase3.default)(validationAddress.postal))) {
    errors.push({ postal: "Postal Code did not match" });
  }

  if (validationAddress.region && address.region && (0, _trim3.default)((0, _upperCase3.default)(address.region)) !== (0, _trim3.default)((0, _upperCase3.default)(validationAddress.region))) {
    errors.push({ region: "Region did not match" });
  }

  if (validationAddress.country && address.country && (0, _upperCase3.default)(address.country) !== (0, _upperCase3.default)(validationAddress.country)) {
    errors.push({ country: "Country did not match" });
  }
  return errors;
}

/**
 * @summary Validates an address, and if fails returns details of issues
 * @param {Object} address - The address object to validate
 * @returns {{validated: boolean, address: *}} - The results of the validation
 */
function validateAddress(address) {
  check(address, Object);
  var validated = true;
  var validationErrors = void 0;
  var validatedAddress = address;
  var formErrors = void 0;
  Schemas.Address.clean(address);
  var validator = getValidator();
  if (validator) {
    var validationResult = Meteor.call(validator, address);
    validatedAddress = validationResult.validatedAddress;
    formErrors = validationResult.errors;
    if (validatedAddress) {
      validationErrors = compareAddress(address, validatedAddress);
      if (validationErrors.length || formErrors.length) {
        validated = false;
      }
    } else {
      // No address, fail validation
      validated = false;
    }
  }
  var validationResults = { validated: validated, fieldErrors: validationErrors, formErrors: formErrors, validatedAddress: validatedAddress };
  return validationResults;
}

/**
 * Reaction Account Methods
 */
Meteor.methods({
  "accounts/validateAddress": validateAddress,
  /*
   * check if current user has password
   */
  "accounts/currentUserHasPassword": function accountsCurrentUserHasPassword() {
    var user = Meteor.users.findOne(Meteor.userId());
    if (user.services.password) {
      return true;
    }
    return false;
  },

  /**
   * accounts/addressBookAdd
   * @description add new addresses to an account
   * @param {Object} address - address
   * @param {String} [accountUserId] - `account.userId` used by admin to edit
   * users
   * @return {Object} with keys `numberAffected` and `insertedId` if doc was
   * inserted
   */
  "accounts/addressBookAdd": function accountsAddressBookAdd(address, accountUserId) {
    check(address, Schemas.Address);
    check(accountUserId, Match.Optional(String));
    // security, check for admin access. We don't need to check every user call
    // here because we are calling `Meteor.userId` from within this Method.
    if (typeof accountUserId === "string") {
      // if this will not be a String -
      // `check` will not pass it.
      if (!_api.Reaction.hasAdminAccess()) {
        throw new Meteor.Error(403, "Access denied");
      }
    }
    this.unblock();

    var userId = accountUserId || Meteor.userId();
    // required default id
    if (!address._id) {
      address._id = Random.id();
    }
    // if address got shippment or billing default, we need to update cart
    // addresses accordingly
    if (address.isShippingDefault || address.isBillingDefault) {
      var cart = _collections.Cart.findOne({ userId: userId });
      // if cart exists
      // First amend the cart,
      if ((typeof cart === "undefined" ? "undefined" : _typeof(cart)) === "object") {
        if (address.isShippingDefault) {
          Meteor.call("cart/setShipmentAddress", cart._id, address);
        }
        if (address.isBillingDefault) {
          Meteor.call("cart/setPaymentAddress", cart._id, address);
        }
      }
      // then change the address that has been affected
      if (address.isShippingDefault) {
        _collections.Accounts.update({
          "userId": userId,
          "profile.addressBook.isShippingDefault": true
        }, {
          $set: {
            "profile.addressBook.$.isShippingDefault": false
          }
        });
      }
      if (address.isBillingDefault) {
        _collections.Accounts.update({
          "userId": userId,
          "profile.addressBook.isBillingDefault": true
        }, {
          $set: {
            "profile.addressBook.$.isBillingDefault": false
          }
        });
      }
    }

    return _collections.Accounts.upsert({
      userId: userId
    }, {
      $set: {
        userId: userId
      },
      $addToSet: {
        "profile.addressBook": address
      }
    });
  },

  /**
   * accounts/addressBookUpdate
   * @description update existing address in user's profile
   * @param {Object} address - address
   * @param {String|null} [accountUserId] - `account.userId` used by admin to
   * edit users
   * @param {shipping|billing} [type] - name of selected address type
   * @return {Number} The number of affected documents
   */
  "accounts/addressBookUpdate": function accountsAddressBookUpdate(address, accountUserId, type) {
    check(address, Schemas.Address);
    check(accountUserId, Match.OneOf(String, null, undefined));
    check(type, Match.Optional(String));
    // security, check for admin access. We don't need to check every user call
    // here because we are calling `Meteor.userId` from within this Method.
    if (typeof accountUserId === "string") {
      // if this will not be a String -
      // `check` will not pass it.
      if (!_api.Reaction.hasAdminAccess()) {
        throw new Meteor.Error(403, "Access denied");
      }
    }
    this.unblock();

    var userId = accountUserId || Meteor.userId();
    // we need to compare old state of isShippingDefault, isBillingDefault with
    // new state and if it was enabled/disabled reflect this changes in cart
    var account = _collections.Accounts.findOne({
      userId: userId
    });
    var oldAddress = account.profile.addressBook.find(function (addr) {
      return addr._id === address._id;
    });

    // happens when the user clicked the address in grid. We need to set type
    // to `true`
    if (typeof type === "string") {
      Object.assign(address, _defineProperty({}, type, true));
    }

    // We want the cart addresses to be updated when current default address
    // (shipping or Billing) are different than the previous one, but also
    // when the current default address(ship or bill) gets edited(so Current and Previous default are the same).
    // This check can be simplified to :
    if (address.isShippingDefault || address.isBillingDefault || oldAddress.isShippingDefault || address.isBillingDefault) {
      var cart = _collections.Cart.findOne({ userId: userId });
      // Cart should exist to this moment, so we doesn't need to to verify its
      // existence.
      if (oldAddress.isShippingDefault !== address.isShippingDefault) {
        // if isShippingDefault was changed and now it is `true`
        if (address.isShippingDefault) {
          // we need to add this address to cart
          Meteor.call("cart/setShipmentAddress", cart._id, address);
          // then, if another address was `ShippingDefault`, we need to unset it
          _collections.Accounts.update({
            "userId": userId,
            "profile.addressBook.isShippingDefault": true
          }, {
            $set: {
              "profile.addressBook.$.isShippingDefault": false
            }
          });
        } else {
          // if new `isShippingDefault` state is false, then we need to remove
          // this address from `cart.shipping`
          Meteor.call("cart/unsetAddresses", address._id, userId, "shipping");
        }
      } else if (address.isShippingDefault && oldAddress.isShippingDefault) {
        // If current Shipping Address was edited but not changed update it to cart too
        Meteor.call("cart/setShipmentAddress", cart._id, address);
      }

      // the same logic used for billing
      if (oldAddress.isBillingDefault !== address.isBillingDefault) {
        if (address.isBillingDefault) {
          Meteor.call("cart/setPaymentAddress", cart._id, address);
          _collections.Accounts.update({
            "userId": userId,
            "profile.addressBook.isBillingDefault": true
          }, {
            $set: {
              "profile.addressBook.$.isBillingDefault": false
            }
          });
        } else {
          Meteor.call("cart/unsetAddresses", address._id, userId, "billing");
        }
      } else if (address.isBillingDefault && oldAddress.isBillingDefault) {
        // If current Billing Address was edited but not changed update it to cart too
        Meteor.call("cart/setPaymentAddress", cart._id, address);
      }
    }

    return _collections.Accounts.update({
      "userId": userId,
      "profile.addressBook._id": address._id
    }, {
      $set: {
        "profile.addressBook.$": address
      }
    });
  },

  /**
   * accounts/addressBookRemove
   * @description remove existing address in user's profile
   * @param {String} addressId - address `_id`
   * @param {String} [accountUserId] - `account.userId` used by admin to edit
   * users
   * @return {Number|Object} The number of removed documents or error object
   */
  "accounts/addressBookRemove": function accountsAddressBookRemove(addressId, accountUserId) {
    check(addressId, String);
    check(accountUserId, Match.Optional(String));
    // security, check for admin access. We don't need to check every user call
    // here because we are calling `Meteor.userId` from within this Method.
    if (typeof accountUserId === "string") {
      // if this will not be a String -
      // `check` will not pass it.
      if (!_api.Reaction.hasAdminAccess()) {
        throw new Meteor.Error(403, "Access denied");
      }
    }
    this.unblock();

    var userId = accountUserId || Meteor.userId();
    // remove this address in cart, if used, before completely removing
    Meteor.call("cart/unsetAddresses", addressId, userId);

    return _collections.Accounts.update({
      "userId": userId,
      "profile.addressBook._id": addressId
    }, {
      $pull: {
        "profile.addressBook": {
          _id: addressId
        }
      }
    });
  },

  /**
   * accounts/inviteShopMember
   * invite new admin users
   * (not consumers) to secure access in the dashboard
   * to permissions as specified in packages/roles
   * @param {String} shopId - shop to invite user
   * @param {String} email - email of invitee
   * @param {String} name - name to address email
   * @returns {Boolean} returns true
   */
  "accounts/inviteShopMember": function accountsInviteShopMember(shopId, email, name) {
    check(shopId, String);
    check(email, String);
    check(name, String);

    this.unblock();

    var shop = _collections.Shops.findOne(shopId);

    if (!shop) {
      var msg = "accounts/inviteShopMember - Shop " + shopId + " not found";
      _api.Logger.error(msg);
      throw new Meteor.Error("shop-not-found", msg);
    }

    if (!_api.Reaction.hasPermission("reaction-accounts", this.userId, shopId)) {
      _api.Logger.error("User " + this.userId + " does not have reaction-accounts permissions");
      throw new Meteor.Error("access-denied", "Access denied");
    }

    var currentUser = Meteor.users.findOne(this.userId);

    var currentUserName = void 0;

    if (currentUser) {
      if (currentUser.profile) {
        currentUserName = currentUser.profile.name || currentUser.username;
      } else {
        currentUserName = currentUser.username;
      }
    } else {
      currentUserName = "Admin";
    }

    var user = Meteor.users.findOne({
      "emails.address": email
    });

    if (!user) {
      var userId = _accountsBase.Accounts.createUser({
        email: email,
        username: name
      });

      var newUser = Meteor.users.findOne(userId);

      if (!newUser) {
        throw new Error("Can't find user");
      }

      var token = Random.id();

      Meteor.users.update(userId, {
        $set: {
          "services.password.reset": { token: token, email: email, when: new Date() }
        }
      });

      // Get shop logo, if available. If not, use default logo from file-system
      var emailLogo = void 0;
      if (Array.isArray(shop.brandAssets)) {
        var brandAsset = (0, _find3.default)(shop.brandAssets, function (asset) {
          return asset.type === "navbarBrandImage";
        });
        var mediaId = _collections.Media.findOne(brandAsset.mediaId);
        emailLogo = _path2.default.join(Meteor.absoluteUrl(), mediaId.url());
      } else {
        emailLogo = Meteor.absoluteUrl() + "resources/email-templates/shop-logo.png";
      }

      var _dataForEmail = {
        // Shop Data
        shop: shop,
        contactEmail: shop.emails[0].address,
        homepage: Meteor.absoluteUrl(),
        emailLogo: emailLogo,
        copyrightDate: (0, _moment2.default)().format("YYYY"),
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
            icon: Meteor.absoluteUrl() + "resources/email-templates/facebook-icon.png",
            link: "https://www.facebook.com"
          },
          googlePlus: {
            display: true,
            icon: Meteor.absoluteUrl() + "resources/email-templates/google-plus-icon.png",
            link: "https://plus.google.com"
          },
          twitter: {
            display: true,
            icon: Meteor.absoluteUrl() + "resources/email-templates/twitter-icon.png",
            link: "https://www.twitter.com"
          }
        },
        // Account Data
        user: Meteor.user(),
        currentUserName: currentUserName,
        invitedUserName: name,
        url: _accountsBase.Accounts.urls.enrollAccount(token)
      };

      // Compile Email with SSR
      var _tpl = "accounts/inviteShopMember";
      var _subject = "accounts/inviteShopMember/subject";
      SSR.compileTemplate(_tpl, _api.Reaction.Email.getTemplate(_tpl));
      SSR.compileTemplate(_subject, _api.Reaction.Email.getSubject(_tpl));

      _api.Reaction.Email.send({
        to: email,
        from: shop.name + " <" + shop.emails[0].address + ">",
        subject: SSR.render(_subject, _dataForEmail),
        html: SSR.render(_tpl, _dataForEmail)
      });
    } else {
      _api.Reaction.Email.send({
        to: email,
        from: shop.name + " <" + shop.emails[0].address + ">",
        subject: SSR.render(subject, dataForEmail),
        html: SSR.render(tpl, dataForEmail)
      });
    }
    return true;
  },

  /**
   * accounts/sendWelcomeEmail
   * send an email to consumers on sign up
   * @param {String} shopId - shopId of new User
   * @param {String} userId - new userId to welcome
   * @returns {Boolean} returns boolean
   */
  "accounts/sendWelcomeEmail": function accountsSendWelcomeEmail(shopId, userId) {
    check(shopId, String);
    check(userId, String);

    this.unblock();

    var user = _collections.Accounts.findOne(userId);
    var shop = _collections.Shops.findOne(shopId);

    // Get shop logo, if available. If not, use default logo from file-system
    var emailLogo = void 0;
    if (Array.isArray(shop.brandAssets)) {
      var brandAsset = (0, _find3.default)(shop.brandAssets, function (asset) {
        return asset.type === "navbarBrandImage";
      });
      var mediaId = _collections.Media.findOne(brandAsset.mediaId);
      emailLogo = _path2.default.join(Meteor.absoluteUrl(), mediaId.url());
    } else {
      emailLogo = Meteor.absoluteUrl() + "resources/email-templates/shop-logo.png";
    }

    var dataForEmail = {
      // Shop Data
      shop: shop,
      contactEmail: shop.emails[0].address,
      homepage: Meteor.absoluteUrl(),
      emailLogo: emailLogo,
      copyrightDate: (0, _moment2.default)().format("YYYY"),
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
          icon: Meteor.absoluteUrl() + "resources/email-templates/facebook-icon.png",
          link: "https://www.facebook.com"
        },
        googlePlus: {
          display: true,
          icon: Meteor.absoluteUrl() + "resources/email-templates/google-plus-icon.png",
          link: "https://plus.google.com"
        },
        twitter: {
          display: true,
          icon: Meteor.absoluteUrl() + "resources/email-templates/twitter-icon.png",
          link: "https://www.twitter.com"
        }
      },
      // Account Data
      user: Meteor.user()
    };

    // anonymous users arent welcome here
    if (!user.emails || !user.emails.length > 0) {
      return true;
    }

    var userEmail = user.emails[0].address;

    var shopEmail = void 0;
    // provide some defaults for missing shop email.
    if (!shop.emails) {
      shopEmail = shop.name + "@localhost";
      _api.Logger.debug("Shop email address not configured. Using " + shopEmail);
    } else {
      shopEmail = shop.emails[0].address;
    }

    var tpl = "accounts/sendWelcomeEmail";
    var subject = "accounts/sendWelcomeEmail/subject";
    SSR.compileTemplate(tpl, _api.Reaction.Email.getTemplate(tpl));
    SSR.compileTemplate(subject, _api.Reaction.Email.getSubject(tpl));

    _api.Reaction.Email.send({
      to: userEmail,
      from: shop.name + " <" + shopEmail + ">",
      subject: SSR.render(subject, dataForEmail),
      html: SSR.render(tpl, dataForEmail)
    });

    return true;
  },

  /**
   * accounts/addUserPermissions
   * @param {String} userId - userId
   * @param {Array|String} permissions -
   *               Name of role/permission.  If array, users
   *               returned will have at least one of the roles
   *               specified but need not have _all_ roles.
   * @param {String} [group] Optional name of group to restrict roles to.
   *                         User"s Roles.GLOBAL_GROUP will also be checked.
   * @returns {Boolean} success/failure
   */
  "accounts/addUserPermissions": function accountsAddUserPermissions(userId, permissions, group) {
    if (!_api.Reaction.hasPermission("reaction-accounts", Meteor.userId(), group)) {
      throw new Meteor.Error(403, "Access denied");
    }
    check(userId, Match.OneOf(String, Array));
    check(permissions, Match.OneOf(String, Array));
    check(group, Match.Optional(String));
    this.unblock();
    try {
      return Roles.addUsersToRoles(userId, permissions, group);
    } catch (error) {
      return _api.Logger.error(error);
    }
  },

  /*
   * accounts/removeUserPermissions
   */
  "accounts/removeUserPermissions": function accountsRemoveUserPermissions(userId, permissions, group) {
    if (!_api.Reaction.hasPermission("reaction-accounts", Meteor.userId(), group)) {
      throw new Meteor.Error(403, "Access denied");
    }
    check(userId, String);
    check(permissions, Match.OneOf(String, Array));
    check(group, Match.Optional(String, null));
    this.unblock();

    try {
      return Roles.removeUsersFromRoles(userId, permissions, group);
    } catch (error) {
      _api.Logger.error(error);
      throw new Meteor.Error(403, "Access Denied");
    }
  },

  /**
   * accounts/setUserPermissions
   * @param {String} userId - userId
   * @param {String|Array} permissions - string/array of permissions
   * @param {String} group - group
   * @returns {Boolean} returns Roles.setUserRoles result
   */
  "accounts/setUserPermissions": function accountsSetUserPermissions(userId, permissions, group) {
    if (!_api.Reaction.hasPermission("reaction-accounts", Meteor.userId(), group)) {
      throw new Meteor.Error(403, "Access denied");
    }
    check(userId, String);
    check(permissions, Match.OneOf(String, Array));
    check(group, Match.Optional(String));
    this.unblock();
    try {
      return Roles.setUserRoles(userId, permissions, group);
    } catch (error) {
      _api.Logger.error(error);
      return error;
    }
  }
});