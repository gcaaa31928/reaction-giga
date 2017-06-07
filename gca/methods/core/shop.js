"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _meteor = require("meteor/meteor");

var _check = require("meteor/check");

var _http = require("meteor/http");

var _vsivsiJobCollection = require("meteor/vsivsi:job-collection");

var _collections = require("/lib/collections");

var Collections = _interopRequireWildcard(_collections);

var _schemas = require("/lib/collections/schemas");

var Schemas = _interopRequireWildcard(_schemas);

var _api = require("/server/api");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Reaction Shop Methods
 */
_meteor.Meteor.methods({
  /**
   * shop/createShop
   * @param {String} shopAdminUserId - optionally create shop for provided userId
   * @param {Object} shopData - optionally provide shop object to customize
   * @return {String} return shopId
   */
  "shop/createShop": function shopCreateShop(shopAdminUserId, shopData) {
    (0, _check.check)(shopAdminUserId, _check.Match.Optional(String));
    (0, _check.check)(shopData, _check.Match.Optional(Schemas.Shop));
    var shop = {};
    // must have owner access to create new shops
    if (!_api.Reaction.hasOwnerAccess()) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    // this.unblock();
    var count = Collections.Shops.find().count() || "";
    var currentUser = _meteor.Meteor.userId();
    // we'll accept a shop object, or clone the current shop
    shop = shopData || Collections.Shops.findOne(_api.Reaction.getShopId());
    // if we don't have any shop data, use fixture

    (0, _check.check)(shop, Schemas.Shop);
    if (!currentUser) {
      throw new _meteor.Meteor.Error("Unable to create shop with specified user");
    }

    // identify a shop admin
    var userId = shopAdminUserId || _meteor.Meteor.userId();
    var adminRoles = Roles.getRolesForUser(currentUser, _api.Reaction.getShopId());
    // ensure unique id and shop name
    shop._id = Random.id();
    shop.name = shop.name + count;

    (0, _check.check)(shop, Schemas.Shop);
    try {
      Collections.Shops.insert(shop);
    } catch (error) {
      return _api.Logger.error(error, "Failed to shop/createShop");
    }
    // we should have created new shop, or errored
    _api.Logger.info("Created shop: ", shop._id);
    Roles.addUsersToRoles([currentUser, userId], adminRoles, shop._id);
    return shop._id;
  },

  /**
   * shop/getLocale
   * @summary determine user's countryCode and return locale object
   * determine local currency and conversion rate from shop currency
   * @return {Object} returns user location and locale
   */
  "shop/getLocale": function shopGetLocale() {
    this.unblock();
    var clientAddress = void 0;
    var geo = new _api.GeoCoder();
    var result = {};
    var defaultCountryCode = "US";
    var localeCurrency = "USD";
    // if called from server, ip won't be defined.
    if (this.connection !== null) {
      clientAddress = this.connection.clientAddress;
    } else {
      clientAddress = "127.0.0.1";
    }

    // get shop locale/currency related data
    var shop = Collections.Shops.findOne(_api.Reaction.getShopId(), {
      fields: {
        addressBook: 1,
        locales: 1,
        currencies: 1,
        currency: 1
      }
    });

    if (!shop) {
      throw new _meteor.Meteor.Error("Failed to find shop data. Unable to determine locale.");
    }
    // cofigure default defaultCountryCode
    // fallback to shop settings
    if (shop.addressBook) {
      if (shop.addressBook.length >= 1) {
        if (shop.addressBook[0].country) {
          defaultCountryCode = shop.addressBook[0].country;
        }
      }
    }
    // geocode reverse ip lookup
    var geoCountryCode = geo.geoip(clientAddress).country_code;

    // countryCode either from geo or defaults
    var countryCode = (geoCountryCode || defaultCountryCode).toUpperCase();

    // get currency rates
    result.currency = {};
    result.locale = shop.locales.countries[countryCode];

    // to return default currency if rates will failed, we need to bring access
    // to this data
    result.shopCurrency = shop.currencies[shop.currency];

    // check if locale has a currency defined
    if (_typeof(result.locale) === "object" && typeof result.locale.currency === "string") {
      localeCurrency = result.locale.currency.split(",");
    }

    // localeCurrency is an array of allowed currencies
    _.each(localeCurrency, function (currency) {
      var exchangeRate = void 0;
      if (shop.currencies[currency]) {
        result.currency = shop.currencies[currency];
        // only fetch rates if locale and shop currency are not equal
        // if shop.curency = locale currency the rate is 1
        if (shop.currency !== currency) {
          exchangeRate = _meteor.Meteor.call("shop/getCurrencyRates", currency);

          if (typeof exchangeRate === "number") {
            result.currency.exchangeRate = exchangeRate;
          } else {
            _api.Logger.warn("Failed to get currency exchange rates.");
          }
        }
      }
    });

    // set server side locale
    _api.Reaction.Locale = result;

    // should contain rates, locale, currency
    return result;
  },

  /**
   * shop/getCurrencyRates
   * @summary It returns the current exchange rate against the shop currency
   * usage: Meteor.call("shop/getCurrencyRates","USD")
   * @param {String} currency code
   * @return {Number|Object} currency conversion rate
   */
  "shop/getCurrencyRates": function shopGetCurrencyRates(currency) {
    (0, _check.check)(currency, String);
    this.unblock();

    var field = "currencies." + currency + ".rate";
    var shop = Collections.Shops.findOne(_api.Reaction.getShopId(), {
      fields: _defineProperty({}, field, 1)
    });

    return typeof shop.currencies[currency].rate === "number" && shop.currencies[currency].rate;
  },

  /**
   * shop/fetchCurrencyRate
   * @summary fetch the latest currency rates from
   * https://openexchangerates.org
   * usage: Meteor.call("shop/fetchCurrencyRate")
   * @fires Collections.Shops#update
   * @returns {undefined}
   */
  "shop/fetchCurrencyRate": function shopFetchCurrencyRate() {
    this.unblock();

    var shopId = _api.Reaction.getShopId();
    var shop = Collections.Shops.findOne(shopId, {
      fields: {
        addressBook: 1,
        locales: 1,
        currencies: 1,
        currency: 1
      }
    });
    var baseCurrency = shop.currency || "USD";
    var shopCurrencies = shop.currencies;

    // fetch shop settings for api auth credentials
    var shopSettings = Collections.Packages.findOne({
      shopId: shopId,
      name: "core"
    }, {
      fields: {
        settings: 1
      }
    });

    // update Shops.currencies[currencyKey].rate
    // with current rates from Open Exchange Rates
    // warn if we don't have app_id
    if (!shopSettings.settings.openexchangerates) {
      throw new _meteor.Meteor.Error("notConfigured", "Open Exchange Rates not configured. Configure for current rates.");
    } else {
      if (!shopSettings.settings.openexchangerates.appId) {
        throw new _meteor.Meteor.Error("notConfigured", "Open Exchange Rates AppId not configured. Configure for current rates.");
      } else {
        // shop open exchange rates appId
        var openexchangeratesAppId = shopSettings.settings.openexchangerates.appId;

        // we'll update all the available rates in Shops.currencies whenever we
        // get a rate request, using base currency
        var rateUrl = "https://openexchangerates.org/api/latest.json?base=" + baseCurrency + "&app_id=" + openexchangeratesAppId;
        var rateResults = void 0;

        // We can get an error if we try to change the base currency with a simple
        // account
        try {
          rateResults = _http.HTTP.get(rateUrl);
        } catch (error) {
          if (error.error) {
            _api.Logger.error(error.message);
            throw new _meteor.Meteor.Error(error.message);
          } else {
            // https://openexchangerates.org/documentation#errors
            throw new _meteor.Meteor.Error(error.response.data.description);
          }
        }

        var exchangeRates = rateResults.data.rates;

        _.each(shopCurrencies, function (currencyConfig, currencyKey) {
          if (exchangeRates[currencyKey] !== undefined) {
            var rateUpdate = {
              // this needed for shop/flushCurrencyRates Method
              "currencies.updatedAt": new Date(rateResults.data.timestamp * 1000)
            };
            var collectionKey = "currencies." + currencyKey + ".rate";
            rateUpdate[collectionKey] = exchangeRates[currencyKey];
            Collections.Shops.update(shopId, {
              $set: rateUpdate
            });
          }
        });
      }
    }
  },

  /**
   * shop/flushCurrencyRate
   * @description Method calls by cron job
   * @summary It removes exchange rates that are too old
   * usage: Meteor.call("shop/flushCurrencyRate")
   * @fires Collections.Shops#update
   * @returns {undefined}
   */
  "shop/flushCurrencyRate": function shopFlushCurrencyRate() {
    this.unblock();

    var shopId = _api.Reaction.getShopId();
    var shop = Collections.Shops.findOne(shopId, {
      fields: {
        currencies: 1
      }
    });
    var updatedAt = shop.currencies.updatedAt;

    // if updatedAt is not a Date(), then there is no rates yet
    if ((typeof updatedAt === "undefined" ? "undefined" : _typeof(updatedAt)) !== "object") {
      throw new _meteor.Meteor.Error("notExists", "[flushCurrencyRates worker]: There is nothing to flush.");
    }

    updatedAt.setHours(updatedAt.getHours() + 48);
    var now = new Date();

    if (now < updatedAt) {
      // todo remove this line. its for tests
      _.each(shop.currencies, function (currencyConfig, currencyKey) {
        var rate = "currencies." + currencyKey + ".rate";

        if (typeof currencyConfig.rate === "number") {
          Collections.Shops.update(shopId, {
            $unset: _defineProperty({}, rate, "")
          });
        }
      });
    }
  },

  /**
   * shop/updateShopExternalServices
   * @description On submit OpenExchangeRatesForm handler
   * @summary we need to rerun fetch exchange rates job on every form submit,
   * that's why we update autoform type to "method-update"
   * @param {Object} modifier - the modifier object generated from the form values
   * @param {String} _id - the _id of the document being updated
   * @fires Collections.Packages#update
   * @todo This method fires Packages collection, so maybe someday it could be
   * @returns {undefined}
   * moved to another file
   */
  "shop/updateShopExternalServices": function shopUpdateShopExternalServices(modifier, _id) {
    (0, _check.check)(modifier, _check.Match.Optional(Schemas.CorePackageConfig));
    (0, _check.check)(_id, String);

    // must have core permissions
    if (!_api.Reaction.hasPermission("core")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }
    this.unblock();

    // we should run new job on every form change, even if not all of them will
    // change currencyRate job
    var refreshPeriod = modifier.$set["settings.openexchangerates.refreshPeriod"];
    var fetchCurrencyRatesJob = new _vsivsiJobCollection.Job(Collections.Jobs, "shop/fetchCurrencyRates", {}).priority("normal").retry({
      retries: 5,
      wait: 60000,
      backoff: "exponential" // delay by twice as long for each subsequent retry
    }).repeat({
      // wait: refreshPeriod * 60 * 1000
      schedule: Collections.Jobs.later.parse.text(refreshPeriod)
    }).save({
      // Cancel any jobs of the same type,
      // but only if this job repeats forever.
      cancelRepeats: true
    });

    Collections.Packages.update(_id, modifier);
    return fetchCurrencyRatesJob;
  },

  /**
   * shop/locateAddress
   * @summary determine user's full location for autopopulating addresses
   * @param {Number} latitude - latitude
   * @param {Number} longitude - longitude
   * @return {Object} returns address
   */
  "shop/locateAddress": function shopLocateAddress(latitude, longitude) {
    (0, _check.check)(latitude, _check.Match.Optional(Number));
    (0, _check.check)(longitude, _check.Match.Optional(Number));
    var clientAddress = void 0;
    this.unblock();

    // if called from server, ip won't be defined.
    if (this.connection !== null) {
      clientAddress = this.connection.clientAddress;
    } else {
      clientAddress = "127.0.0.1";
    }

    // begin actual address lookups
    if (latitude !== null && longitude !== null) {
      var _geo = new _api.GeoCoder();
      return _geo.reverse(latitude, longitude);
    }
    // geocode reverse ip lookup
    var geo = new _api.GeoCoder();
    return geo.geoip(clientAddress);
  },

  /**
   * shop/createTag
   * @summary creates new tag
   * @param {String} tagName - new tag name
   * @param {Boolean} isTopLevel - if true -- new tag will be created on top of
   * tags tree
   * @since 0.14.0
   * @hooks after method
   * @return {String} with created tag _id
   */
  "shop/createTag": function shopCreateTag(tagName, isTopLevel) {
    (0, _check.check)(tagName, String);
    (0, _check.check)(isTopLevel, Boolean);

    // must have 'core' permissions
    if (!_api.Reaction.hasPermission("core")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    var tag = {
      name: tagName,
      slug: _api.Reaction.getSlug(tagName),
      isTopLevel: isTopLevel,
      updatedAt: new Date(),
      createdAt: new Date()
    };

    return Collections.Tags.insert(tag);
  },

  /**
   * shop/updateHeaderTags
   * @summary method to insert or update tag with hierarchy
   * @param {String} tagName will insert, tagName + tagId will update existing
   * @param {String} tagId - tagId to update
   * @param {String} currentTagId - currentTagId will update related/hierarchy
   * @return {Boolean} return true/false after insert
   */
  "shop/updateHeaderTags": function shopUpdateHeaderTags(tagName, tagId, currentTagId) {
    (0, _check.check)(tagName, String);
    (0, _check.check)(tagId, _check.Match.OneOf(String, null, void 0));
    (0, _check.check)(currentTagId, _check.Match.OneOf(String, null, void 0));

    var newTagId = {};
    // must have 'core' permissions
    if (!_api.Reaction.hasPermission("core")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }
    this.unblock();

    var newTag = {
      slug: _api.Reaction.getSlug(tagName),
      name: tagName
    };

    var existingTag = Collections.Tags.findOne({
      slug: _api.Reaction.getSlug(tagName),
      name: tagName
    });

    if (tagId) {
      return Collections.Tags.update(tagId, {
        $set: newTag
      }, function () {
        _api.Logger.debug("Changed name of tag " + tagId + " to " + tagName);
        return true;
      });
    } else if (existingTag) {
      // if is currentTag
      if (currentTagId) {
        return Collections.Tags.update(currentTagId, {
          $addToSet: {
            relatedTagIds: existingTag._id
          }
        }, function () {
          _api.Logger.debug("Added tag " + existingTag.name + " to the related tags list for tag " + currentTagId);
          return true;
        });
      }
      // update existing tag
      return Collections.Tags.update(existingTag._id, {
        $set: {
          isTopLevel: true
        }
      }, function () {
        _api.Logger.debug("Marked tag " + existingTag.name + " as a top level tag");
        return true;
      });
    }
    // create newTags
    newTagId = _meteor.Meteor.call("shop/createTag", tagName, !currentTagId);

    // if result is an Error object, we return it immediately
    if (typeof newTagId !== "string") {
      return newTagId;
    }

    if (currentTagId) {
      return Collections.Tags.update(currentTagId, {
        $addToSet: {
          relatedTagIds: newTagId
        }
      }, function () {
        _api.Logger.debug("Added tag" + newTag.name + " to the related tags list for tag " + currentTagId);
        return true;
      });
      // TODO: refactor this. unnecessary check
    } else if (typeof newTagId === "string" && !currentTagId) {
      return true;
    }
    throw new _meteor.Meteor.Error(403, "Failed to update header tags.");
  },

  /**
   * shop/removeHeaderTag
   * @param {String} tagId - method to remove tag navigation tags
   * @param {String} currentTagId - currentTagId
   * @return {String} returns remove result
   */
  "shop/removeHeaderTag": function shopRemoveHeaderTag(tagId, currentTagId) {
    (0, _check.check)(tagId, String);
    (0, _check.check)(currentTagId, String);
    // must have core permissions
    if (!_api.Reaction.hasPermission("core")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }
    this.unblock();
    // remove from related tag use
    Collections.Tags.update(currentTagId, {
      $pull: {
        relatedTagIds: tagId
      }
    });
    // check to see if tag is in use.
    var productCount = Collections.Products.find({
      hashtags: {
        $in: [tagId]
      }
    }).count();
    // check to see if in use as a related tag
    var relatedTagsCount = Collections.Tags.find({
      relatedTagIds: {
        $in: [tagId]
      }
    }).count();
    // not in use anywhere, delete it
    if (productCount === 0 && relatedTagsCount === 0) {
      return Collections.Tags.remove(tagId);
    }
    // unable to delete anything
    throw new _meteor.Meteor.Error(403, "Unable to delete tags that are in use.");
  },

  /**
   * shop/hideHeaderTag
   * @param {String} tagId - method to remove tag navigation tags
   * @param {String} currentTagId - currentTagId
   * @return {String} returns remove result
   */
  "shop/hideHeaderTag": function shopHideHeaderTag(tagId) {
    (0, _check.check)(tagId, String);
    // must have core permissions
    if (!_api.Reaction.hasPermission("core")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }
    this.unblock();
    // hide it
    return Collections.Tags.update({
      _id: tagId
    }, {
      $set: {
        isTopLevel: false
      }
    });
  },

  /**
   * shop/getWorkflow
   * @summary gets the current shop workflows
   * @param {String} name - workflow name
   * @return {Array} returns workflow array
   */
  "shop/getWorkflow": function shopGetWorkflow(name) {
    (0, _check.check)(name, String);

    var shopWorkflows = Collections.Shops.findOne({
      defaultWorkflows: {
        $elemMatch: {
          provides: name
        }
      }
    }, {
      fields: {
        defaultWorkflows: true
      }
    });
    return shopWorkflows;
  },
  /**
   * shop/updateLanguageConfiguration
   * @summary enable / disable a language
   * @param {String} language - language name | "all" to bulk enable / disable
   * @param {Boolean} enabled - true / false
   * @return {Array} returns workflow array
   */
  "shop/updateLanguageConfiguration": function shopUpdateLanguageConfiguration(language, enabled) {
    (0, _check.check)(language, String);
    (0, _check.check)(enabled, Boolean);

    // must have core permissions
    if (!_api.Reaction.hasPermission("core")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }
    this.unblock();

    var shop = Collections.Shops.findOne({
      _id: _api.Reaction.getShopId()
    });

    var defaultLanguage = shop.language;

    if (language === "all") {
      var updateObject = {};

      if (Array.isArray(shop.languages)) {
        shop.languages.forEach(function (languageData, index) {
          if (languageData.i18n === defaultLanguage) {
            updateObject["languages." + index + ".enabled"] = true;
          } else {
            updateObject["languages." + index + ".enabled"] = enabled;
          }
        });
      }
      return Collections.Shops.update({
        _id: _api.Reaction.getShopId()
      }, {
        $set: updateObject
      });
    } else if (language === defaultLanguage) {
      return Collections.Shops.update({
        "_id": _api.Reaction.getShopId(),
        "languages.i18n": language
      }, {
        $set: {
          "languages.$.enabled": true
        }
      });
    }

    return Collections.Shops.update({
      "_id": _api.Reaction.getShopId(),
      "languages.i18n": language
    }, {
      $set: {
        "languages.$.enabled": enabled
      }
    });
  },

  /**
   * shop/updateCurrencyConfiguration
   * @summary enable / disable a currency
   * @param {String} currency - currency name | "all" to bulk enable / disable
   * @param {Boolean} enabled - true / false
   * @return {Number} returns mongo update result
   */
  "shop/updateCurrencyConfiguration": function shopUpdateCurrencyConfiguration(currency, enabled) {
    (0, _check.check)(currency, String);
    (0, _check.check)(enabled, Boolean);
    // must have core permissions
    if (!_api.Reaction.hasPermission("core")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }
    this.unblock();

    var shop = Collections.Shops.findOne({
      _id: _api.Reaction.getShopId()
    });

    var defaultCurrency = shop.currency;

    if (currency === "all") {
      var updateObject = {};
      for (var currencyName in shop.currencies) {
        if ({}.hasOwnProperty.call(shop.currencies, currencyName) && currencyName !== "updatedAt") {
          if (currencyName === defaultCurrency) {
            updateObject["currencies." + currencyName + ".enabled"] = true;
          } else {
            updateObject["currencies." + currencyName + ".enabled"] = enabled;
          }
        }
      }

      return Collections.Shops.update({
        _id: _api.Reaction.getShopId()
      }, {
        $set: updateObject
      });
    } else if (currency === defaultCurrency) {
      return Collections.Shops.update({
        _id: _api.Reaction.getShopId()
      }, {
        $set: _defineProperty({}, "currencies." + currency + ".enabled", true)
      });
    }

    return Collections.Shops.update({
      _id: _api.Reaction.getShopId()
    }, {
      $set: _defineProperty({}, "currencies." + currency + ".enabled", enabled)
    });
  },

  /**
   * shop/updateBrandAsset
   * @param {Object} asset - brand asset {mediaId: "", type, ""}
   * @return {Int} returns update result
   */
  "shop/updateBrandAssets": function shopUpdateBrandAssets(asset) {
    (0, _check.check)(asset, {
      mediaId: String,
      type: String
    });
    // must have core permissions
    if (!_api.Reaction.hasPermission("core")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }
    this.unblock();

    // Does our shop contain the brandasset we're tring to add
    var shopWithBrandAsset = Collections.Shops.findOne({
      "_id": _api.Reaction.getShopId(),
      "brandAssets.type": asset.type
    });

    // If it does, then we update it with the new asset reference
    if (shopWithBrandAsset) {
      return Collections.Shops.update({
        "_id": _api.Reaction.getShopId(),
        "brandAssets.type": "navbarBrandImage"
      }, {
        $set: {
          "brandAssets.$": {
            mediaId: asset.mediaId,
            type: asset.type
          }
        }
      });
    }

    // Otherwise we insert a new brand asset reference
    return Collections.Shops.update({
      _id: _api.Reaction.getShopId()
    }, {
      $push: {
        brandAssets: {
          mediaId: asset.mediaId,
          type: asset.type
        }
      }
    });
  },

  /*
   * shop/togglePackage
   * @summary enable/disable Reaction package
   * @param {String} packageId - package _id
   * @param {Boolean} enabled - current package `enabled` state
   * @return {Number} mongo update result
   */
  "shop/togglePackage": function shopTogglePackage(packageId, enabled) {
    (0, _check.check)(packageId, String);
    (0, _check.check)(enabled, Boolean);
    if (!_api.Reaction.hasAdminAccess()) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    return Collections.Packages.update(packageId, {
      $set: {
        enabled: !enabled
      }
    });
  },
  /*
  * shop/changeLayout
  * @summary Change the layout for all workflows so you can use a custom one
  * @param {String} shopId - the shop's ID
  * @param {String} layout - new layout to use
  * @return {Number} mongo update result
   */
  "shop/changeLayouts": function shopChangeLayouts(shopId, newLayout) {
    (0, _check.check)(shopId, String);
    (0, _check.check)(newLayout, String);
    var shop = Collections.Shops.findOne(shopId);
    for (var i = 0; i < shop.layout.length; i++) {
      shop.layout[i].layout = newLayout;
    }
    return Collections.Shops.update(shopId, {
      $set: { layout: shop.layout }
    });
  }
});