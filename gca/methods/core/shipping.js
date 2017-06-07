"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.methods = undefined;

var _meteor = require("meteor/meteor");

var _check = require("meteor/check");

var _collections = require("/lib/collections");

var _api = require("/server/api");

var _schemas = require("/lib/collections/schemas");

/*
 * Reaction Shipping Methods
 * methods typically used for checkout (shipping, taxes, etc)
 */
var methods = exports.methods = {
  /**
   * shipping/updateShipmentQuotes
   * @summary gets shipping rates and updates the users cart methods
   * @todo add orderId argument/fallback
   * @param {String} cartId - cartId
   * @return {undefined}
   */
  "shipping/updateShipmentQuotes": function shippingUpdateShipmentQuotes(cartId) {
    (0, _check.check)(cartId, String);
    if (!cartId) {
      return [];
    }
    this.unblock();
    var cart = _collections.Cart.findOne(cartId);
    (0, _check.check)(cart, _schemas.Cart);

    if (cart) {
      var rates = _meteor.Meteor.call("shipping/getShippingRates", cart);
      var selector = void 0;
      var update = void 0;
      // temp hack until we build out multiple shipment handlers if we have an existing item update it, otherwise add to set.
      if (cart.shipping) {
        selector = {
          "_id": cartId,
          "shipping._id": cart.shipping[0]._id
        };
        update = {
          $set: {
            "shipping.$.shipmentQuotes": rates
          }
        };
      } else {
        selector = {
          _id: cartId
        };
        update = {
          $push: {
            shipping: {
              shipmentQuotes: rates
            }
          }
        };
      }
      // add quotes to the cart
      _collections.Cart.update(selector, update, function (error) {
        if (error) {
          _api.Logger.warn("Error adding rates to cart " + cartId, error);
          return;
        }
        _api.Logger.debug("Success adding rates to cart " + cartId, rates);
      });
    }
  },

  /**
   * shipping/getShippingRates
   * @summary just gets rates, without updating anything
   * @param {Object} cart - cart object
   * @return {Array} return updated rates in cart
   */
  "shipping/getShippingRates": function shippingGetShippingRates(cart) {
    (0, _check.check)(cart, _schemas.Cart);
    var rates = [];
    // must have items to calculate shipping
    if (!cart.items) {
      return rates;
    }
    // hooks for other shipping rate events
    // all callbacks should return rates
    _api.Hooks.Events.run("onGetShippingRates", rates, cart);
    _api.Logger.debug("getShippingRates returning rates", rates);
    return rates;
  }
};

_meteor.Meteor.methods(methods);