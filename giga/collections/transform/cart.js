"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cartTransform = undefined;

var _accountingJs = require("accounting-js");

var _accountingJs2 = _interopRequireDefault(_accountingJs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * getSummary
 * @summary iterates over cart items with computations
 * @param {Array} items - cart.items array
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
 * transform methods used to return cart calculated values
 * cartCount, cartSubTotal, cartShipping, cartTaxes, cartTotal
 * are calculated by a transformation on the collection
 * and are available to use in template as cart.xxx
 * in template: {{cart.cartCount}}
 * in code: Cart.findOne().cartTotal()
 */
var cartTransform = exports.cartTransform = {
  cartCount: function cartCount() {
    return getSummary(this.items, ["quantity"]);
  },
  cartShipping: function cartShipping() {
    // loop through the cart.shipping, sum shipments.
    var rate = getSummary(this.shipping, ["shipmentMethod", "rate"]);
    var handling = getSummary(this.shipping, ["shipmentMethod", "handling"]);
    var shipping = handling + rate || 0;
    return _accountingJs2.default.toFixed(shipping, 2);
  },
  cartSubTotal: function cartSubTotal() {
    var subTotal = getSummary(this.items, ["quantity"], ["variants", "price"]);
    return _accountingJs2.default.toFixed(subTotal, 2);
  },
  cartTaxes: function cartTaxes() {
    // taxes are calculated in a Cart.after.update hooks
    // the tax value stored with the cart is the effective tax rate
    // calculated by line items
    // in the imports/core/taxes plugin
    var tax = this.tax || 0;
    var subTotal = parseFloat(this.cartSubTotal());
    var taxTotal = subTotal * tax;
    return _accountingJs2.default.toFixed(taxTotal, 2);
  },
  cartDiscounts: function cartDiscounts() {
    var discount = this.discount || 0;
    return _accountingJs2.default.toFixed(discount, 2);
  },
  cartTotal: function cartTotal() {
    var subTotal = parseFloat(this.cartSubTotal());
    var shipping = parseFloat(this.cartShipping());
    var taxes = parseFloat(this.cartTaxes());
    var discount = parseFloat(this.cartDiscounts());
    var discountTotal = Math.max(0, subTotal - discount);
    var total = discountTotal + shipping + taxes;
    return _accountingJs2.default.toFixed(total, 2);
  }
};