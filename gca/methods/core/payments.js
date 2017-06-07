"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.methods = undefined;

var _meteor = require("meteor/meteor");

var _check = require("meteor/check");

var _api = require("/server/api");

var methods = exports.methods = {
  /**
   * payments/apply
   * @summary adds payment to order
   * @param {String} id - id
   * @param {Object} paymentMethod - formatted payment method object
   * @param  {String} collection collection (either Orders or Cart)
   * @returns {String} return cart update result
   */
  "payments/apply": function paymentsApply(id, paymentMethod) {
    var collection = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "Cart";

    (0, _check.check)(id, String);
    (0, _check.check)(paymentMethod, Object);
    (0, _check.check)(collection, String);
    var Collection = _api.Reaction.Collections[collection];

    return Collection.update({
      _id: id
    }, {
      $addToSet: {
        billing: { paymentMethod: paymentMethod }
      }
    });
  }
};

// export methods to Meteor
_meteor.Meteor.methods(methods);