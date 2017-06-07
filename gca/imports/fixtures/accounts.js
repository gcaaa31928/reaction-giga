"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defaults2 = require("lodash/defaults");

var _defaults3 = _interopRequireDefault(_defaults2);

exports.getUser = getUser;
exports.getAddress = getAddress;
exports.createAccountFactory = createAccountFactory;

exports.default = function () {
  createAccountFactory();
};

var _faker = require("faker");

var _faker2 = _interopRequireDefault(_faker);

var _dburlesFactory = require("meteor/dburles:factory");

var _collections = require("/lib/collections");

var _shops = require("./shops");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Factory account
 */

function getUser() {
  var existingUser = Meteor.users.findOne();
  return existingUser || _dburlesFactory.Factory.create("user");
}

function getAddress() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var defaults = {
    fullName: options.fullName || _faker2.default.name.findName(),
    address1: options.address1 || _faker2.default.address.streetAddress(),
    address2: options.address2 || _faker2.default.address.secondaryAddress(),
    city: options.city || _faker2.default.address.city(),
    company: _faker2.default.company.companyName(),
    phone: _faker2.default.phone.phoneNumber(),
    region: options.region || _faker2.default.address.stateAbbr(),
    postal: options.postal || _faker2.default.address.zipCode(),
    country: options.country || _faker2.default.address.countryCode(),
    isCommercial: options.isCommercial || _faker2.default.random.boolean(),
    isShippingDefault: options.isShippingDefault || _faker2.default.random.boolean(),
    isBillingDefault: options.isBillingDefault || _faker2.default.random.boolean(),
    metafields: []
  };
  return (0, _defaults3.default)(options, defaults);
}

function createAccountFactory() {
  _dburlesFactory.Factory.define("account", _collections.Accounts, {
    shopId: (0, _shops.getShop)()._id,
    userId: getUser()._id,
    emails: [{
      address: _faker2.default.internet.email(),
      verified: _faker2.default.random.boolean()
    }],
    acceptsMarketing: true,
    state: "new",
    note: _faker2.default.lorem.sentences(),
    profile: {
      addressBook: [getAddress()]
    },
    metafields: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });
}