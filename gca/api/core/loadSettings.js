"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadSettings = loadSettings;

var _collections = require("/lib/collections");

var _api = require("/server/api");

var _ejson = require("meteor/ejson");

/**
 * ReactionRegistry.loadSettings
 * @description
 * This basically allows you to "hardcode" all the settings. You can change them
 * via admin etc for the session, but when the server restarts they'll
 * be restored back to the supplied json
 *
 * All settings are private unless added to `settings.public`
 *
 * Meteor account services can be added in `settings.services`
 * @summary updates package settings, accepts json string
 * @param {Object} json - json object to insert
 * @return {Boolean} boolean -  returns true on insert
 * @example
 *  ReactionRegistry.loadSettings Assets.getText("settings/reaction.json")
 */
function loadSettings(json) {
  check(json, String);
  var exists = void 0;
  var service = void 0;
  var services = void 0;
  var settings = void 0;
  var validatedJson = _ejson.EJSON.parse(json);

  // validate json and error out if not an array
  if (!_.isArray(validatedJson[0])) {
    _api.Logger.warn("Load Settings is not an array. Failed to load settings.");
    return;
  }

  // loop settings and upsert packages.
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = validatedJson[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var pkg = _step.value;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = pkg[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var item = _step2.value;

          exists = _collections.Packages.findOne({
            name: item.name
          });
          //
          // TODO migrate functionality to Reaction.Import
          // Reaction.Import.package(item, shopId);
          //
          // insert into the Packages collection
          if (exists) {
            result = _collections.Packages.upsert({
              name: item.name
            }, {
              $set: {
                settings: item.settings,
                enabled: item.enabled
              }
            }, {
              multi: true,
              upsert: true,
              validate: false
            });
          }
          // sets the private settings of various
          // accounts authentication services
          if (item.settings.services) {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
              for (var _iterator3 = item.settings.services[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                services = _step3.value;

                for (service in services) {
                  // actual settings for the service
                  if ({}.hasOwnProperty.call(services, service)) {
                    settings = services[service];
                    ServiceConfiguration.configurations.upsert({
                      service: service
                    }, {
                      $set: settings
                    });
                    _api.Logger.debug("service configuration loaded: " + item.name + " | " + service);
                  }
                }
              }
            } catch (err) {
              _didIteratorError3 = true;
              _iteratorError3 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                  _iterator3.return();
                }
              } finally {
                if (_didIteratorError3) {
                  throw _iteratorError3;
                }
              }
            }
          }
          _api.Logger.debug("loaded local package data: " + item.name);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
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
}