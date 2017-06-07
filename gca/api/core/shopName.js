"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setShopName = setShopName;

var _collections = require("/lib/collections");

var _api = require("/server/api");

/**
 *  setShopName
 *  @private setShopName
 *  @param {Object} shop - shop
 *  @summary when new shop is created, set shop name if REACTION_SHOP_NAME env var exists
 *  @returns {undefined} undefined
 */
function setShopName(shop) {
  var shopName = process.env.REACTION_SHOP_NAME;

  if (shopName) {
    // if this shop name has already been used, don't use it again
    if (!!_collections.Shops.findOne({
      name: shopName
    })) {
      _api.Logger.info("Default shop name " + shopName + " already used");
    } else {
      // update the shop name with the REACTION_SHOP_NAME env var
      try {
        _collections.Shops.update({
          _id: shop._id
        }, {
          $set: {
            name: shopName
          }
        });
      } catch (err) {
        _api.Logger.error("Failed to update shop name", err);
      }
    }
  }
}