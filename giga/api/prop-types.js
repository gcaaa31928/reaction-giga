"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PropTypes = undefined;

var _every2 = require("lodash/every");

var _every3 = _interopRequireDefault(_every2);

var _isArray2 = require("lodash/isArray");

var _isArray3 = _interopRequireDefault(_isArray2);

var _isEmpty2 = require("lodash/isEmpty");

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _schemas = require("/lib/collections/schemas");

var Schemas = _interopRequireWildcard(_schemas);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TagSchema = Schemas.Tag.newContext();

var PropTypes = exports.PropTypes = {};

/**
 * React Component propType validator for a single Tag
 * @param  {Object} props An object containing all props passed into the component
 * @param  {String} propName Name of prop to validate
 * @return {Error|undefined} returns an error if validation us unseccessful
 */
PropTypes.Tag = function (props, propName) {
  check(props, Object);
  check(propName, String);

  if ((0, _isEmpty3.default)(props[propName]) === false) {
    if (TagSchema.validate(props[propName]) === false) {
      return new Error("Tag must be of type: Schemas.Tag");
    }
  }
};

/**
 * React Component propType validator for an array of Tags
 * @param  {Object} props An object containing all props passed into the component
 * @param  {String} propName Name of prop to validate
 * @return {Error|undefined} returns an error if validation us unseccessful
 */
PropTypes.arrayOfTags = function (props, propName) {
  check(props, Object);
  check(propName, String);

  if ((0, _isEmpty3.default)(props[propName]) === false && (0, _isArray3.default)(props[propName])) {
    var valid = (0, _every3.default)(props[propName], function (tag) {
      return TagSchema.validate(tag);
    });

    if (valid === false) {
      return new Error("Objects in array must be of type: Schemas.Tag");
    }
  }
};