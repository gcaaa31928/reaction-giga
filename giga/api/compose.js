"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _reactKomposer = require("react-komposer");

Object.keys(_reactKomposer).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _reactKomposer[key];
    }
  });
});
exports.composeWithTracker = composeWithTracker;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * getTrackerLoader creates a Meteor Tracker to watch dep updates from
 * passed in reactiveMapper funtion
 * @param  {Function} reactiveMapper data fetching function to bind to a tracker
 * @return {Function} composed function
 */
function getTrackerLoader(reactiveMapper) {
  return function (props, onData, env) {
    var trackerCleanup = null;
    var handler = Tracker.nonreactive(function () {
      return Tracker.autorun(function () {
        // assign the custom clean-up function.
        trackerCleanup = reactiveMapper(props, onData, env);
      });
    });

    return function () {
      if (typeof trackerCleanup === "function") trackerCleanup();
      return handler.stop();
    };
  };
}

/**
 * Re-implementation of composeWithTracker from v1.x
 * @param {Function} reactiveMapper data fetching function to bind to a tracker
 * @param {React.Component} LoadingComponent react component for a custom loading screen
 * @return {Function} composed function
 */
/**
 * Wrapper around react-komposer v2 to provide some backwars compatability
 * for features from v1.
 */
function composeWithTracker(reactiveMapper, LoadingComponent) {
  var options = {};

  if (typeof LoadingComponent === "undefined") {
    options.loadingHandler = function () {
      // eslint-disable-line react/display-name
      return _react2.default.createElement(LoadingComponent, null);
    };
  }

  return (0, _reactKomposer.compose)(getTrackerLoader(reactiveMapper), options);
}