"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getShop = getShop;
exports.getShopId = getShopId;
exports.getAddress = getAddress;
exports.createShopFactory = createShopFactory;

exports.default = function () {
  /**
   * Shop Factory
   * @summary define shop Factory
   */
  createShopFactory();
};

var _faker = require("faker");

var _faker2 = _interopRequireDefault(_faker);

var _collections = require("/lib/collections");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getShop() {
  createShopFactory();
  var existingShop = _collections.Shops.findOne();
  return existingShop || Factory.create("shop");
}

function getShopId() {
  var shop = _collections.Shops.find({}).fetch()[0];
  return shop && shop._id;
}

function getAddress() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var defaults = {
    fullName: _faker2.default.name.findName(),
    address1: _faker2.default.address.streetAddress(),
    address2: _faker2.default.address.secondaryAddress(),
    city: _faker2.default.address.city(),
    company: _faker2.default.company.companyName(),
    phone: _faker2.default.phone.phoneNumber(),
    region: _faker2.default.address.stateAbbr(),
    postal: _faker2.default.address.zipCode(),
    country: _faker2.default.address.countryCode(),
    isCommercial: _faker2.default.random.boolean(),
    isShippingDefault: _faker2.default.random.boolean(),
    isBillingDefault: _faker2.default.random.boolean(),
    metafields: []
  };
  return _.defaults(options, defaults);
}

function createShopFactory() {
  Factory.define("shop", _collections.Shops, {
    name: _faker2.default.internet.domainName(),
    description: _faker2.default.company.catchPhrase(),
    keywords: _faker2.default.company.bsAdjective(),
    addressBook: [getAddress()],
    domains: ["localhost"],
    emails: [{
      address: _faker2.default.internet.email(),
      verified: _faker2.default.random.boolean()
    }],
    currency: "USD", // could use faker.finance.currencyCode()
    currencies: {
      USD: {
        format: "%s%v",
        symbol: "$"
      },
      EUR: {
        format: "%v %s",
        symbol: "€",
        decimal: ",",
        thousand: "."
      }
    },
    locale: "en",
    locales: {
      continents: {
        NA: "North America"
      },
      countries: {
        US: {
          name: "United States",
          native: "United States",
          phone: "1",
          continent: "NA",
          capital: "Washington D.C.",
          currency: "USD,USN,USS",
          languages: "en"
        }
      }
    },
    baseUOM: "OZ",
    unitsOfMeasure: [{
      uom: "OZ",
      label: "Ounces",
      default: true
    }, {
      uom: "LB",
      label: "Pounds"
    }, {
      uom: "GR",
      label: "Grams"
    }, {
      uom: "KG",
      label: "Kilograms"
    }],
    layout: [{
      layout: "coreLayout",
      workflow: "coreLayout",
      theme: "default",
      enabled: true
    }, {
      layout: "coreLayout",
      workflow: "coreCartWorkflow",
      collection: "Cart",
      theme: "default",
      enabled: true
    }, {
      layout: "coreLayout",
      workflow: "coreOrderWorkflow",
      collection: "Orders",
      theme: "default",
      enabled: true
    }, {
      layout: "coreLayout",
      workflow: "coreOrderShipmentWorkflow",
      collection: "Orders",
      theme: "default",
      enabled: true
    }],
    public: true,
    brandAssets: [{
      mediaId: "J8Bhq3uTtdgwZx3rz",
      type: "navbarBrandImage"
    }],
    timezone: "US/Pacific",
    metafields: [],
    defaultRoles: ["guest", "account/profile"],
    createdAt: new Date(),
    updatedAt: new Date()
  });
}