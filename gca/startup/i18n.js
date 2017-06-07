"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.loadTranslation = loadTranslation;
exports.loadTranslations = loadTranslations;
exports.loadCoreTranslations = loadCoreTranslations;

exports.default = function () {
  /**
   * Hook to setup core i18n imports during Reaction init
   */
  _api.Hooks.Events.add("onCoreInit", function () {
    loadCoreTranslations();
  });
};

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _meteor = require("meteor/meteor");

var _collections = require("/lib/collections");

var _api = require("/server/api");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// taken from here: http://stackoverflow.com/a/32749571
function directoryExists(dirPath) {
  try {
    return _fs2.default.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

/**
 * load a single translation object as an Asset
 * loadTranslation should generally be used
 * before startup, to ensure that Assets load.
 * @param  {Object} source a json i18next object
 * @return {Boolean} false if assets weren't loaded
 */

function loadTranslation(source) {
  try {
    var content = typeof source === "string" ? JSON.parse(source) : source;
    var json = (typeof source === "undefined" ? "undefined" : _typeof(source)) === "object" ? JSON.stringify(source) : source;

    _collections.Assets.update({
      type: "i18n",
      name: content[0].i18n,
      ns: content[0].ns
    }, {
      $set: {
        content: json
      }
    }, {
      upsert: true
    });

    _api.Logger.debug("Translation assets updated for ", content[0].ns);
  } catch (e) {
    return false;
  }
  return false;
}

/**
 * load an array of translation objects
 * and import using loadTranslation
 * @param  {Object} sources array of i18next translations
 * @return {Boolean} false if assets weren't loaded
 */
function loadTranslations(sources) {
  sources.forEach(function (source) {
    loadTranslation(source);
  });
}

/**
 * loadCoreTranslations imports i18n json
 * files from private/data/i18n
 * into the Assets collection
 * Assets collection is processed with Reaction.Import
 * after all assets have been loaded.
 */

function loadCoreTranslations() {
  var meteorPath = _fs2.default.realpathSync(process.cwd() + "/../");
  var i18nFolder = meteorPath + "/server/assets/app/data/i18n/";

  if (directoryExists(i18nFolder)) {
    _fs2.default.readdir(i18nFolder, _meteor.Meteor.bindEnvironment(function (err, files) {
      if (err) throw new _meteor.Meteor.Error("No translations found for import.", err);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = files[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var file = _step.value;

          if (~file.indexOf("json")) {
            _api.Logger.debug("Importing Translations from " + file);
            var json = _fs2.default.readFileSync(i18nFolder + file, "utf8");
            var content = JSON.parse(json);

            _collections.Assets.update({
              type: "i18n",
              name: content[0].i18n,
              ns: content[0].ns
            }, {
              $set: {
                content: json
              }
            }, {
              upsert: true
            });
          }
        }

        // purposely broad results here
        // we will be processing assets
        // inserted using loadTranslation
        // as well.
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

      _collections.Assets.find({ type: "i18n" }).forEach(function (t) {
        _api.Logger.debug("Importing " + t.name + " translation for \"" + t.ns + "\"");
        if (t.content) {
          _api.Reaction.Import.process(t.content, ["i18n"], _api.Reaction.Import.translation);
        } else {
          _api.Logger.debug("No translation content found for " + t.name + " - " + t.ns + " asset");
        }
      });
    }));
  }
}