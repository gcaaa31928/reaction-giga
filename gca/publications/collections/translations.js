"use strict";

var _collections = require("/lib/collections");

var _api = require("/server/api");

/**
 * Translations publication
 * @param {String, Array} sessionLanguages - current sessionLanguage default to 'en'
 * @returns { Object } returns Translations
 * @todo like to see the langages validated more with a schema
 */
Meteor.publish("Translations", function (languages) {
  check(languages, Match.OneOf(String, Array));
  var shopId = _api.Reaction.getShopId();
  var shopLanguage = _collections.Shops.findOne(shopId).language;
  var sessionLanguages = [];
  var langTranQuery = [];

  // set shop default
  sessionLanguages.push(shopLanguage);
  // lets get all these langauges
  if (typeof languages === "array") {
    sessionLanguages.concat(languages);
  } else {
    sessionLanguages.push(languages);
  }
  // add in the shop filter
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = sessionLanguages[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var sessionLanguage = _step.value;

      langTranQuery.push({
        i18n: sessionLanguage,
        shopId: shopId
      });
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

  return _collections.Translations.find({
    $or: langTranQuery
  });
});