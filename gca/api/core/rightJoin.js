"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * @summary Returns an disjoint object as right join. For a visualization, see:
 *          http://www.codeproject.com/KB/database/Visual_SQL_Joins/Visual_SQL_JOINS_orig.jpg
 *          Additionally, the join is done recursively on properties of
 *          nested objects as well. Nested arrays are handled like
 *          primitive values.
 * @author Tom De Caluwé
 * @param {Object} leftSet An object that can contain nested sub-objects
 * @param {Object} rightSet An object that can contain nested sub-objects
 * @returns {Object} The disjoint object that does only contain properties
 *                   from the rightSet. But only those, that were not present
 *                   in the leftSet.
 */
var doRightJoinNoIntersection = function doRightJoinNoIntersection(leftSet, rightSet) {
  if (rightSet === null) return null;

  var rightJoin = void 0;
  if (Array.isArray(rightSet)) {
    rightJoin = [];
  } else {
    rightJoin = {};
  }
  var findRightOnlyProperties = function findRightOnlyProperties() {
    return Object.keys(rightSet).filter(function (key) {
      if (_typeof(rightSet[key]) === "object" && !Array.isArray(rightSet[key])) {
        // Nested objects are always considered
        return true;
      }
      // Array or primitive value
      return !leftSet.hasOwnProperty(key);
    });
  };

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = findRightOnlyProperties()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var key = _step.value;

      if (_typeof(rightSet[key]) === "object") {
        // subobject or array
        if (leftSet.hasOwnProperty(key) && (_typeof(leftSet[key]) !== "object" || Array.isArray(leftSet[key]) !== Array.isArray(rightSet[key]))) {
          // This is not expected!
          throw new Error("Left object and right object's internal structure must be " + "congruent! Offending key: " + key);
        }
        var rightSubJoin = doRightJoinNoIntersection(leftSet.hasOwnProperty(key) ? leftSet[key] : {}, rightSet[key]);

        var obj = {};
        if (rightSubJoin === null) {
          obj[key] = null;
        } else if (Object.keys(rightSubJoin).length !== 0 || Array.isArray(rightSubJoin)) {
          // object or (empty) array
          obj[key] = rightSubJoin;
        }
        rightJoin = Object.assign(rightJoin, obj);
      } else {
        // primitive value (or array)
        if (Array.isArray(rightSet)) {
          rightJoin.push(rightSet[key]);
        } else {
          var _obj = {};
          _obj[key] = rightSet[key];
          rightJoin = Object.assign(rightJoin, _obj);
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

  return rightJoin;
};

exports.default = doRightJoinNoIntersection;