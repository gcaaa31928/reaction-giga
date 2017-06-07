"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _indexOf2 = require("lodash/indexOf");

var _indexOf3 = _interopRequireDefault(_indexOf2);

exports.default = function () {
  /**
   * Reaction Collection Hooks
   * transform collections based on events
   *
   * See: https://github.com/matb33/meteor-collection-hooks
   */

  /**
   * before product update
   */
  // TODO: review this.  not sure this does what it was intended to
  _collections.Products.before.update(function (userId, product, fieldNames, modifier) {
    // handling product positions updates
    if ((0, _indexOf3.default)(fieldNames, "positions") !== -1) {
      if (modifier.$addToSet) {
        if (modifier.$addToSet.positions) {
          createdAt = new Date();
          updatedAt = new Date();
          if (modifier.$addToSet.positions.$each) {
            for (position in modifier.$addToSet.positions.$each) {
              if ({}.hasOwnProperty.call(modifier.$addToSet.positions.$each, position)) {
                createdAt = new Date();
                updatedAt = new Date();
              }
            }
          } else {
            modifier.$addToSet.positions.updatedAt = updatedAt;
          }
        }
      }
    }
  });
};

var _collections = require("/lib/collections");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }