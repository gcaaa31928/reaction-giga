"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _collections = require("/lib/collections");

var _products = require("/lib/api/products");

exports.default = Catalog = {
  /**
   * setProduct
   * @summary method to set default/parameterized product variant
   * @param {String} currentProductId - set current productId
   * @param {String} currentVariantId - set current variantId
   * @return {undefined} return nothing, sets in session
   */
  setProduct: function setProduct(currentProductId, currentVariantId) {
    var productId = currentProductId;
    var variantId = currentVariantId;
    if (!productId.match(/^[A-Za-z0-9]{17}$/)) {
      var product = _collections.Products.findOne({
        handle: productId.toLowerCase()
      });
      if (product) {
        productId = product._id;
      }
    }
    setCurrentProduct(productId);
    setCurrentVariant(variantId);
  },


  /**
   * getProductPriceRange
   * @summary get price range of a product
   * if no only one price available, return it
   * otherwise return a string range
   * @todo remove string return and replace with object
   * @todo move all this methods this to export function after 1.3
   * @param {String} [productId] - current product _id
   * @return {Object} range, min, max
   */
  getProductPriceRange: function getProductPriceRange(productId) {
    var _this = this;

    var product = (0, _products.applyProductRevision)(_collections.Products.findOne(productId));
    if (!product) {
      return "";
    }
    var variants = this.getTopVariants(product._id);
    // if we have variants we have a price range.
    // this processing will default on the server
    var visibileVariant = variants.filter(function (variant) {
      return variant.isVisible === true;
    });

    if (visibileVariant.length > 0) {
      var variantPrices = [];
      variants.forEach(function (variant) {
        if (variant.isVisible === true) {
          var range = _this.getVariantPriceRange(variant._id);
          if (typeof range === "string") {
            var firstPrice = parseFloat(range.substr(0, range.indexOf(" ")));
            var lastPrice = parseFloat(range.substr(range.lastIndexOf(" ") + 1));
            variantPrices.push(firstPrice, lastPrice);
          } else {
            variantPrices.push(range);
          }
        } else {
          variantPrices.push(0, 0);
        }
      });
      var priceMin = _.min(variantPrices);
      var priceMax = _.max(variantPrices);
      var priceRange = priceMin + " - " + priceMax;
      // if we don't have a range
      if (priceMin === priceMax) {
        priceRange = priceMin.toString();
      }
      var priceObject = {
        range: priceRange,
        min: priceMin,
        max: priceMax
      };
      return priceObject;
    }
    // if we have no variants subscribed to (client)
    // we'll get the price object previously from the product
    return product.price;
  },


  /**
   * getVariantPriceRange
   * @summary get price range of a variant if it has child options.
   * if no child options, return main price value
   * @todo remove string return and replace with object
   * @param {String} [variantId] - current variant _Id
   * @return {String} formatted price or price range
   */
  getVariantPriceRange: function getVariantPriceRange(variantId) {
    var children = this.getVariants(variantId);
    var visibleChildren = children.filter(function (child) {
      return child.isVisible;
    });

    switch (visibleChildren.length) {
      case 0:
        var topVariant = (0, _products.applyProductRevision)(_collections.Products.findOne(variantId));
        // topVariant could be undefined when we removing last top variant
        return topVariant && topVariant.price;
      case 1:
        return visibleChildren[0].price;
      default:
        var priceMin = Number.POSITIVE_INFINITY;
        var priceMax = Number.NEGATIVE_INFINITY;

        children.map(function (child) {
          if (child.isVisible === true) {
            if (child.price < priceMin) {
              priceMin = child.price;
            }
            if (child.price > priceMax) {
              priceMax = child.price;
            }
          }
        });

        if (priceMin === priceMax) {
          // TODO check impact on i18n/formatPrice from moving return to string
          return priceMin.toString();
        }
        return priceMin + " - " + priceMax;
    }
  },


  /**
   * getVariantQuantity
   * @description calculate a sum of descendants `inventoryQuantity`
   * @param {Object} variant - top-level variant
   * @return {Number} summary of options quantity
   */
  getVariantQuantity: function getVariantQuantity(variant) {
    var options = this.getVariants(variant._id);
    if (options && options.length) {
      return options.reduce(function (sum, option) {
        return sum + option.inventoryQuantity || 0;
      }, 0);
    }
    return variant.inventoryQuantity || 0;
  },


  /**
   * @method getPublishedOrRevision
   * @description return top product revision if available
   * @param {Object} product product or variant document
   * @return {Object} product document
   */
  getPublishedOrRevision: function getPublishedOrRevision(product) {
    return (0, _products.applyProductRevision)(product);
  },


  /**
   * @method getVariants
   * @description Get all parent variants
   * @summary could be useful for products and for top level variants
   * @param {String} [id] - product _id
   * @param {String} [type] - type of variant
   * @return {Array} Parent variants or empty array
   */
  getVariants: function getVariants(id, type) {
    return _collections.Products.find({
      ancestors: { $in: [id] },
      type: type || "variant"
    }).map(this.getPublishedOrRevision);
  },


  /**
   * @method getTopVariants
   * @description Get only product top level variants
   * @param {String} [id] - product _id
   * @return {Array} Product top level variants or empty array
   */
  getTopVariants: function getTopVariants(id) {
    return _collections.Products.find({
      ancestors: [id],
      type: "variant"
    }).map(this.getPublishedOrRevision);
  }
};