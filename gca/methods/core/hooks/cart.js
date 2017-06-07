"use strict";

var _meteor = require("meteor/meteor");

var _collections = require("/lib/collections");

var _api = require("/server/api");

require("../cart");

// // Meteor.after to call after
_api.MethodHooks.after("cart/submitPayment", function (options) {
  // if cart/submit had an error we won't copy cart to Order
  // and we'll throw an error.
  _api.Logger.debug("MethodHooks after cart/submitPayment", options);
  // Default return value is the return value of previous call in method chain
  // or an empty object if there's no result yet.
  var result = options.result || {};
  if (typeof options.error === "undefined") {
    var cart = _collections.Cart.findOne({
      userId: _meteor.Meteor.userId()
    });

    // update workflow
    _meteor.Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "paymentSubmitted");

    // create order
    if (cart) {
      if (!cart.billing) {
        _api.Logger.debug("MethodHooks after cart/submitPayment. No billing address after payment! userId:", _meteor.Meteor.userId(), "options:", options);
      }

      if (cart.items && cart.billing && cart.billing[0].paymentMethod) {
        var orderId = _meteor.Meteor.call("cart/copyCartToOrder", cart._id);
        // Return orderId as result from this after hook call.
        // This is done by extending the existing result.
        result.orderId = orderId;
      } else {
        throw new _meteor.Meteor.Error("An error occurred verifing payment method. Failed to save order.");
      }
    }
  }
  return result;
});
// this needed to keep correct loading order. Methods should be loaded before hooks