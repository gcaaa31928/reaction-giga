"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyProductRevision = applyProductRevision;

var _i18next = require("i18next");

var _i18next2 = _interopRequireDefault(_i18next);

var _orderBy = require("lodash/orderBy");

var _orderBy2 = _interopRequireDefault(_orderBy);

var _meteor = require("meteor/meteor");

var _reactiveDict = require("meteor/reactive-dict");

var _lib = require("/imports/plugins/core/router/lib");

var _api = require("/lib/api");

var _collections = require("/lib/collections");

var _catalog = require("./catalog");

var _catalog2 = _interopRequireDefault(_catalog);

var _metadata = require("/lib/api/router/metadata");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// ReactionProduct is only intended to be used on the client, but it's placed
// in common code because of it is imported by the Products schema

/**
 *  currentProduct
 *  @summary Reactive current product dependency, ensuring reactive products, without session
 *  @todo this is a messy class implementation, normalize it.
 *  @description
 *  products:

 */
var ReactionProduct = new _reactiveDict.ReactiveDict("currentProduct");

function applyProductRevision(product) {
  if (product) {
    if (product.__revisions && product.__revisions.length) {
      var cleanProduct = Object.assign({}, product);
      delete cleanProduct.__revisions;
      var revisedProduct = void 0;
      // check for product revisions and set that as the current product
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = product.__revisions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var revision = _step.value;

          if (!revision.parentDocument) {
            revisedProduct = product.__revisions[0].documentData;
          }
        }

        // if there are no revision to product (image and/or tag only) just set the original product as the product
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

      if (!revisedProduct) {
        revisedProduct = cleanProduct;
      }
      return Object.assign({}, revisedProduct, {
        __published: cleanProduct,
        __draft: product.__revisions[0]
      });
    }
    return product;
  }

  return null;
}

ReactionProduct.sortProducts = function (products, tag) {
  var sorted = [];

  sorted = (0, _orderBy2.default)(products,
  // Sort by postion for tag
  function (product) {
    return product.positions && product.positions[tag] && product.positions[tag].position;
  },
  // Then by creation date for tag
  function (product) {
    return product.positions && product.positions[tag] && product.positions[tag].createdAt;
  },
  // Finally sort by creation date
  "createdAt");

  return sorted;
};

/**
 * setCurrentVariant
 * @param {String} variantId - set current variantId
 * @return {undefined}
 */
ReactionProduct.setCurrentVariant = function (variantId) {
  if (variantId === null) {
    ReactionProduct.set("variantId", null);
    ReactionProduct.set("variantId", ReactionProduct.selectedVariantId());
  }
  if (!variantId) {
    return;
  }
  var currentId = ReactionProduct.selectedVariantId();
  if (currentId === variantId) {
    return;
  }
  ReactionProduct.set("variantId", variantId);
};

/**
 * ReactionProduct.setProduct
 * this will be deprecated in favor of template.instance data.
 *
 * @summary method to set default/parameterized product variant
 * @param {String} currentProductId - set current productId
 * @param {String} currentVariantId - set current variantId
 * @return {Object} product object
 */
ReactionProduct.setProduct = function (currentProductId, currentVariantId) {
  var productId = currentProductId || _lib.Router.getParam("handle");
  var variantId = currentVariantId || _lib.Router.getParam("variantId");

  // Find the current product
  var product = _collections.Products.findOne({
    $or: [{ handle: productId.toLowerCase() }, // Try the handle (slug) lowercased
    { handle: productId }, // Otherwise try the handle (slug) untouched
    { _id: productId // Last attempt, try the product id
    }]
  });

  productId = product && product._id;

  if (product) {
    // set the default variant
    // as the default.
    if (!variantId) {
      var variants = ReactionProduct.getTopVariants(productId);
      variantId = Array.isArray(variants) && variants.length && variants[0]._id || null;
    }
    // set in our reactive dictionary
    ReactionProduct.set("productId", productId);
    ReactionProduct.set("variantId", variantId);
  }

  // Update the meta data when a product is selected
  _metadata.MetaData.init(_lib.Router.current());

  return applyProductRevision(product);
};

/**
 * selectedProductId
 * @summary get the currently active/requested product
 * @return {String} currently selected product id
 */
ReactionProduct.selectedProductId = function () {
  return ReactionProduct.get("productId");
};

/**
 * selectedVariantId
 * @summary get the currently active/requested variant
 * @return {String} currently selected variant id
 */
ReactionProduct.selectedVariantId = function () {
  var id = ReactionProduct.get("variantId");
  if (id !== null) {
    return id;
  }
  var variants = ReactionProduct.getVariants();

  if (!(variants.length > 0)) {
    return [];
  }

  id = variants[0]._id;
  // ReactionProduct.set("variantId", id);
  return id;
};

/**
 * selectedVariant
 * @summary get the currently active/requested variant object
 * @return {Object} currently selected variant object
 */
ReactionProduct.selectedVariant = function () {
  var id = ReactionProduct.selectedVariantId();
  if (typeof id === "string") {
    return applyProductRevision(_collections.Products.findOne(id));
  }
  return [];
};

/**
 * selectedProduct
 * @summary get the currently active/requested product object
 * @return {Object|undefined} currently selected product cursor
 */
ReactionProduct.selectedProduct = function () {
  var id = ReactionProduct.selectedProductId();
  if (typeof id === "string") {
    return applyProductRevision(_collections.Products.findOne(id));
  }
  return undefined;
};

/**
 * checkChildVariants
 * @summary return number of child variants for a parent
 * @param {String} parentVariantId - parentVariantId
 * @return {Number} count of childVariants for this parentVariantId
 */
ReactionProduct.checkChildVariants = function (parentVariantId) {
  var childVariants = ReactionProduct.getVariants(parentVariantId);
  return childVariants.length ? childVariants.length : 0;
};

/**
 * checkInventoryVariants
 * @summary return number of inventory variants for a parent
 * @param {String} parentVariantId - parentVariantId
 * @todo could be combined with checkChildVariants in one method
 * @todo inventoryVariants are deprecated. remove this.
 * @return {Number} count of inventory variants for this parentVariantId
 */
ReactionProduct.checkInventoryVariants = function (parentVariantId) {
  var inventoryVariants = ReactionProduct.getVariants(parentVariantId, "inventory");
  return inventoryVariants.length ? inventoryVariants.length : 0;
};

/**
 * getVariantPriceRange
 * @summary get price range of a variant if it has child options.
 * if no child options, return main price value
 * @todo remove string return and replace with object
 * @param {String} [id] - current variant _Id
 * @return {String} formatted price or price range
 */
ReactionProduct.getVariantPriceRange = function (id) {
  return _catalog2.default.getVariantPriceRange(id || ReactionProduct.selectedVariant()._id);
};

/**
 * getProductPriceRange
 * @summary get price range of a product
 * if no only one price available, return it
 * otherwise return a string range
 * @todo remove string return and replace with object
 * @param {String} [id] - current product _id
 * @return {String} formatted price or price range
 */
ReactionProduct.getProductPriceRange = function (id) {
  return _catalog2.default.getProductPriceRange(id || ReactionProduct.selectedProductId());
};

/**
 * getVariantQuantity
 * @description middleware method which calls the same named common method.
 * @todo maybe we could remove this after 1.3. But for now I like how it looks.
 * @param {Object} doc - variant object
 * @return {Number} summary of options quantity or top-level variant
 * inventoryQuantity
 */
ReactionProduct.getVariantQuantity = function (doc) {
  return _catalog2.default.getVariantQuantity(doc);
};

/**
 * @method getVariants
 * @description Get all parent variants
 * @summary could be useful for products and for top level variants
 * @param {String} [id] - product _id
 * @param {String} [type] - type of variant
 * @return {Array} Parent variants or empty array
 */
ReactionProduct.getVariants = function (id, type) {
  return _catalog2.default.getVariants(id || ReactionProduct.selectedProductId(), type);
};

/**
 * @method getTopVariants
 * @description Get only product top level variants
 * @param {String} [id] - product _id
 * @return {Array} Product top level variants or empty array
 */
ReactionProduct.getTopVariants = function (id) {
  return _catalog2.default.getTopVariants(id || ReactionProduct.selectedProductId());
};

/**
 * getTag
 * @summary This needed for naming `positions` object. Method could return `tag`
 * route name or shop name as default name.
 * @return {String} tag name or shop name
 */
ReactionProduct.getTag = function () {
  return (0, _api.getCurrentTag)() || (0, _api.getShopName)().toLowerCase();
};

/**
 * getProductsByTag
 * @summary method to return tag specific product
 * @param {String} tag - tag string
 * @return {Object} - return products collection cursor filtered by tag
 */
ReactionProduct.getProductsByTag = function (tag) {
  var hashtags = void 0;
  var newRelatedTags = void 0;
  var relatedTag = void 0;
  var relatedTags = void 0;
  var selector = {};

  if (tag) {
    hashtags = [];
    relatedTags = [tag];
    while (relatedTags.length) {
      newRelatedTags = [];
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = relatedTags[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          relatedTag = _step2.value;

          if (hashtags.indexOf(relatedTag._id) === -1) {
            hashtags.push(relatedTag._id);
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      relatedTags = newRelatedTags;
    }
    selector.hashtags = {
      $in: hashtags
    };
  }
  var cursor = _collections.Products.find(selector);
  return cursor;
};

/**
 * publishProduct
 * @summary product publishing and alert
 * @param {Object} productOrArray - product Object
 * @returns {undefined} - returns nothing, and alerts, happen here
 */
ReactionProduct.publishProduct = function (productOrArray) {
  var products = !_.isArray(productOrArray) ? [productOrArray] : productOrArray;
  /* eslint no-loop-func: 1 */
  //
  // TODO review process for publishing arrays of product
  //
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    var _loop = function _loop() {
      var product = _step3.value;

      _meteor.Meteor.call("products/publishProduct", product._id, function (error, result) {
        // eslint-disable-line no-loop-func
        if (error) {
          Alerts.add(error, "danger", {
            placement: "productGridItem",
            id: product._id
          });
          throw new _meteor.Meteor.Error("error publishing product", error);
        }
        var alertSettings = {
          placement: "productGridItem",
          id: product._id,
          autoHide: true,
          dismissable: false
        };
        if (result) {
          Alerts.add(_i18next2.default.t("productDetail.publishProductVisible", { product: product.title }), "success", alertSettings);
        } else {
          Alerts.add(_i18next2.default.t("productDetail.publishProductHidden", { product: product.title }), "warning", alertSettings);
        }
      });
    };

    for (var _iterator3 = products[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      _loop();
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }
};

/**
 * publishProduct
 * @summary product publishing and alert
 * @param {Object} productOrArray - product Object
 * @returns {undefined} - returns nothing, and alerts, happen here
 */
ReactionProduct.toggleVisibility = function (productOrArray) {
  var products = !_.isArray(productOrArray) ? [productOrArray] : productOrArray;
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    var _loop2 = function _loop2() {
      var product = _step4.value;

      _meteor.Meteor.call("products/toggleVisibility", product._id, function (error, result) {
        // eslint-disable-line no-loop-func
        if (error) {
          Alerts.add(error, "danger", {
            placement: "productGridItem",
            id: product._id
          });
          throw new _meteor.Meteor.Error("error publishing product", error);
        }
        var alertSettings = {
          placement: "productGridItem",
          id: product._id,
          autoHide: true,
          dismissable: false
        };
        if (result) {
          Alerts.add(_i18next2.default.t("productDetail.publishProductVisible", { product: product.title }), "success", alertSettings);
        } else {
          Alerts.add(_i18next2.default.t("productDetail.publishProductHidden", { product: product.title }), "warning", alertSettings);
        }
      });
    };

    for (var _iterator4 = products[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      _loop2();
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }
};

/**
 * cloneProduct
 * @summary product cloning and alert
 * @param {Object|Array} productOrArray - if this method calls from productGrid
 * it receives and array with product _id or _ids, but if it calls from PDP, when
 * it receive a `Object` with _id. It needed to determine the source of call.
 * @returns {undefined} - returns nothing, and alerts, happen here
 */
ReactionProduct.cloneProduct = function (productOrArray) {
  var products = !Array.isArray(productOrArray) ? [productOrArray] : productOrArray;

  return _meteor.Meteor.call("products/cloneProduct", products, function (error, result) {
    if (error) {
      Alerts.add(error, "danger", { placement: "productGridItem" });
      throw new _meteor.Meteor.Error("error cloning product", error);
    }
    if (result) {
      if (products.length === 1) {
        Alerts.add(_i18next2.default.t("productDetail.clonedAlert", { product: products[0].title }), "success", {
          placement: "productGridItem",
          id: products[0]._id,
          autoHide: true,
          dismissable: false
        });
      } else {
        Alerts.add(_i18next2.default.t("productDetail.clonedAlert_plural", { product: _i18next2.default.t("productDetail.theSelectedProducts"), count: 0 }), "success", {
          placement: "productGridItem",
          id: products[0]._id,
          autoHide: true,
          dismissable: false
        });
      }
    }
    // this statement allow us to redirect to a new clone PDP if clone action
    // was fired within PDP, not within productGrid.
    if (!Array.isArray(productOrArray)) {
      _lib.Router.go("product", {
        handle: result[0]
      });
    }
  });
};

/**
 * archiveProduct
 * @summary confirm to archive product
 * @param {Object} productOrArray - product Object
 * @returns {undefined} - returns nothing, and alerts, happen here
 */
ReactionProduct.archiveProduct = function (productOrArray) {
  var products = !_.isArray(productOrArray) ? [productOrArray] : productOrArray;
  var productIds = _.map(products, function (product) {
    return typeof product === "string" ? product : product._id;
  });
  var confirmTitle = void 0;
  // we have to use so difficult logic with `length` check because of some
  // languages, which have different phrase forms for each of cases.
  // we are using i18next `plural` functionality here.
  // @see: http://i18next.com/translate/pluralSimple
  if (products.length === 1) {
    confirmTitle = _i18next2.default.t("productDetailEdit.archiveThisProduct");
  } else {
    confirmTitle = _i18next2.default.t("productDetailEdit.archiveSelectedProducts");
  }

  Alerts.alert({
    title: confirmTitle,
    type: "warning",
    showCancelButton: true,
    confirmButtonText: "Archive"
  }, function (isConfirm) {
    if (isConfirm) {
      _meteor.Meteor.call("products/archiveProduct", productIds, function (error, result) {
        var title = void 0;
        if (error) {
          title = products.length === 1 ? products[0].title || _i18next2.default.t("productDetail.archiveErrorTheProduct") : _i18next2.default.t("productDetail.theSelectedProducts");
          Alerts.toast(_i18next2.default.t("productDetail.productArchiveError", { product: title }), "error");
          throw new _meteor.Meteor.Error("Error archiving " + title, error);
        }
        if (result) {
          _lib.Router.go("/");
          if (products.length === 1) {
            title = products[0].title || _i18next2.default.t("productDetail.theProduct");
            Alerts.toast(_i18next2.default.t("productDetail.archivedAlert", { product: title }), "info");
          } else {
            title = _i18next2.default.t("productDetail.theSelectedProducts");
            Alerts.toast(_i18next2.default.t("productDetail.archivedAlert_plural", { product: title, count: 0 }), "info");
          }
        }
      });
    }
  });
};

ReactionProduct.isAncestorDeleted = function (product, includeSelf) {
  var productIds = [].concat(_toConsumableArray(product.ancestors));

  if (includeSelf) {
    productIds.push(product._id);
  }

  // Verify there are no deleted ancestors,
  // Variants cannot be restored if their parent product / variant is deleted
  var archivedCount = _collections.Revisions.find({
    "documentId": { $in: productIds },
    "documentData.isDeleted": true,
    "workflow.status": {
      $nin: ["revision/published"]
    }
  }).count();

  if (archivedCount > 0) {
    return true;
  }

  return false;
};

exports.default = ReactionProduct;