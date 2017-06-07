"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _collections = require("/lib/collections");

var _api = require("/server/api");

var _i18n = require("/server/startup/i18n");

/**
 * Reaction Shop Methods
 */
Meteor.methods({
  /**
   * i18n/flushTranslations
   * @summary Helper method to remove all translations, and reload from jsonFiles
   * @return {undefined}
   */
  "i18n/flushTranslations": function i18nFlushTranslations() {
    if (!_api.Reaction.hasAdminAccess()) {
      throw new Meteor.Error(403, "Access Denied");
    }
    var shopId = _api.Reaction.getShopId();
    _collections.Translations.remove({
      shopId: shopId
    });
    (0, _i18n.loadCoreTranslations)();
    _api.Reaction.Import.flush();
  },
  /**
   * i18n/addTranslation
   * @param {String | Array} lng - language
   * @param {String} namespace - namespace
   * @param {String} key - i18n key
   * @param {String} message - i18n message
   * @summary Helper method to add translations
   * @return {String} insert result
   */
  "i18n/addTranslation": function i18nAddTranslation(lng, namespace, key, message) {
    check(lng, Match.OneOf(String, Array));
    check(namespace, String);
    check(key, String);
    check(message, String);
    // string or first langauge
    var i18n = lng;
    if ((typeof lng === "undefined" ? "undefined" : _typeof(lng)) === "object") {
      i18n = lng[0];
    }

    if (!_api.Reaction.hasAdminAccess()) {
      throw new Meteor.Error(403, "Access Denied");
    }
    var tran = "\n      \"i18n\": \"" + i18n + "\",\n      \"shopId\": \"" + _api.Reaction.getShopId() + "\"\n    ";

    var setTran = "\"translation." + namespace + "." + key + "\": \"" + message + "\"";
    _collections.Translations.update({ tran: tran }, { setTran: setTran });
  }
});