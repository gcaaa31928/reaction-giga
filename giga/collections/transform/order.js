"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.orderTransform = undefined;

var _accountingJs = require("accounting-js");

var _accountingJs2 = _interopRequireDefault(_accountingJs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO: This is a duplicate of the cart transform with just the names changed.
// This should be factored to be just one file for both

/**
 * getSummary
 * @summary iterates over order items with computations
 * @param {Array} items - order.items array
 * @param {Array} prop - path to item property represented by array
 * @param {Array} [prop2] - path to another item property represented by array
 * @return {Number} - computations result
 */
function getSummary(items, prop, prop2) {
  try {
    if (Array.isArray(items)) {
      return items.reduce(function (sum, item) {
        if (prop2) {
          // S + a * b, where b could be b1 or b2
          return sum + item[prop[0]] * (prop2.length === 1 ? item[prop2[0]] : item[prop2[0]][prop2[1]]);
        }
        // S + b, where b could be b1 or b2
        return sum + (prop.length === 1 ? item[prop[0]] : item[prop[0]][prop[1]]);
      }, 0);
    }
  } catch (e) {
    // If data not prepared we should send a number to avoid exception with
    // `toFixed`. This could happens if user stuck on `completed` checkout stage
    // by some reason.
    return 0;
  }
  return 0;
}

/**
 * Reaction transform collections
 *
 * transform methods used to return order calculated values
 * orderCount, orderSubTotal, orderShipping, orderTaxes, orderTotal
 * are calculated by a transformation on the collection
 * and are available to use in template as order.xxx
 * in template: {{order.orderCount}}
 * in code: order.findOne().orderTotal()
 */
var orderTransform = exports.orderTransform = {
  orderCount: function orderCount() {
    return getSummary(this.items, ["quantity"]);
  },
  orderShipping: function orderShipping() {
    // loop through the order.shipping, sum shipments.
    var rate = getSummary(this.shipping, ["shipmentMethod", "rate"]);
    var handling = getSummary(this.shipping, ["shipmentMethod", "handling"]);
    var shipping = handling + rate || 0;
    return _accountingJs2.default.toFixed(shipping, 2);
  },
  orderSubTotal: function orderSubTotal() {
    var subTotal = getSummary(this.items, ["quantity"], ["variants", "price"]);
    return _accountingJs2.default.toFixed(subTotal, 2);
  },
  orderTaxes: function orderTaxes() {
    // taxes are calculated in a order.after.update hooks
    // the tax value stored with the order is the effective tax rate
    // calculated by line items
    // in the imports/core/taxes plugin
    var tax = this.tax || 0;
    var subTotal = parseFloat(this.orderSubTotal());
    var taxTotal = subTotal * tax;
    return _accountingJs2.default.toFixed(taxTotal, 2);
  },
  orderDiscounts: function orderDiscounts() {
    var discount = this.discount || 0;
    return _accountingJs2.default.toFixed(discount, 2);
  },
  orderTotal: function orderTotal() {
    var subTotal = parseFloat(this.orderSubTotal());
    var shipping = parseFloat(this.orderShipping());
    var taxes = parseFloat(this.orderTaxes());
    var discount = parseFloat(this.orderDiscounts());
    var discountTotal = Math.max(0, subTotal - discount);
    var total = discountTotal + shipping + taxes;
    return _accountingJs2.default.toFixed(total, 2);
  },
  itemCount: function itemCount() {
    var count = 0;
    if (Array.isArray(this.items)) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.items[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var item = _step.value;

          count += item.quantity;
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
    return count;
  }
};