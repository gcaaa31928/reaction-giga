"use strict";

var _sortBy2 = require("lodash/sortBy");

var _sortBy3 = _interopRequireDefault(_sortBy2);

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _ejson = require("meteor/ejson");

var _check = require("meteor/check");

var _meteor = require("meteor/meteor");

var _api = require("/lib/api");

var _hooks = require("/imports/plugins/core/revisions/server/hooks");

var _collections = require("/lib/collections");

var _api2 = require("/server/api");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Reaction Product Methods
 */
/* eslint new-cap: 0 */
/* eslint no-loop-func: 0 */
/* eslint quotes: 0 */

/**
 * updateVariantProductField
 * @summary updates the variant
 * @param {Array} variants - the array of variants
 * @param {String} field - the field to update
 * @param {String} value - the value to add
 * @return {Array} - return an array
 */
function updateVariantProductField(variants, field, value) {
  return variants.map(function (variant) {
    _meteor.Meteor.call("products/updateProductField", variant._id, field, value);
  });
}

/**
 * @array toDenormalize
 * @summary contains a list of fields, which should be denormalized
 * @type {string[]}
 */
var toDenormalize = ["price", "inventoryQuantity", "lowInventoryWarningThreshold", "inventoryPolicy", "inventoryManagement"];

/**
 * @function createTitle
 * @description Recursive method which trying to find a new `title`, given the
 * existing copies
 * @param {String} newTitle - product `title`
 * @param {String} productId - current product `_id`
 * @return {String} title - modified `title`
 */
function createTitle(newTitle, productId) {
  // exception product._id needed for cases then double triggering happens
  var title = newTitle || "";
  var titleCount = _collections.Products.find({
    title: title,
    _id: {
      $nin: [productId]
    }
  }).count();
  // current product "copy" number
  var titleNumberSuffix = 0;
  // product handle prefix
  var titleString = title;
  // copySuffix "-copy-number" suffix of product
  var copySuffix = titleString.match(/-copy-\d+$/) || titleString.match(/-copy$/);
  // if product is a duplicate, we should take the copy number, and cut
  // the handle
  if (copySuffix) {
    // we can have two cases here: copy-number and just -copy. If there is
    // no numbers in copySuffix then we should put 1 in handleNumberSuffix
    titleNumberSuffix = +String(copySuffix).match(/\d+$/) || 1;
    // removing last numbers and last "-" if it presents
    titleString = title.replace(/\d+$/, '').replace(/-$/, '');
  }

  // if we have more than one product with the same handle, we should mark
  // it as "copy" or increment our product handle if it contain numbers.
  if (titleCount > 0) {
    // if we have product with name like "product4", we should take care
    // about its uniqueness
    if (titleNumberSuffix > 0) {
      title = titleString + "-" + (titleNumberSuffix + titleCount);
    } else {
      // first copy will be "...-copy", second: "...-copy-2"
      title = titleString + "-copy" + (titleCount > 1 ? "-" + titleCount : "");
    }
  }

  // we should check again if there are any new matches with DB
  if (_collections.Products.find({
    title: title
  }).count() !== 0) {
    title = createTitle(title, productId);
  }
  return title;
}

/**
 * @function createHandle
 * @description Recursive method which trying to find a new `handle`, given the
 * existing copies
 * @param {String} productHandle - product `handle`
 * @param {String} productId - current product `_id`
 * @return {String} handle - modified `handle`
 */
function createHandle(productHandle, productId) {
  var handle = productHandle || "";
  // exception product._id needed for cases then double triggering happens
  var handleCount = _collections.Products.find({
    handle: handle,
    _id: {
      $nin: [productId]
    }
  }).count();
  // current product "copy" number
  var handleNumberSuffix = 0;
  // product handle prefix
  var handleString = handle;
  // copySuffix "-copy-number" suffix of product
  var copySuffix = handleString.match(/-copy-\d+$/) || handleString.match(/-copy$/);

  // if product is a duplicate, we should take the copy number, and cut
  // the handle
  if (copySuffix) {
    // we can have two cases here: copy-number and just -copy. If there is
    // no numbers in copySuffix then we should put 1 in handleNumberSuffix
    handleNumberSuffix = +String(copySuffix).match(/\d+$/) || 1;
    // removing last numbers and last "-" if it presents
    handleString = handle.replace(/\d+$/, '').replace(/-$/, '');
  }

  // if we have more than one product with the same handle, we should mark
  // it as "copy" or increment our product handle if it contain numbers.
  if (handleCount > 0) {
    // if we have product with name like "product4", we should take care
    // about its uniqueness
    if (handleNumberSuffix > 0) {
      handle = handleString + "-" + (handleNumberSuffix + handleCount);
    } else {
      // first copy will be "...-copy", second: "...-copy-2"
      handle = handleString + "-copy" + (handleCount > 1 ? '-' + handleCount : '');
    }
  }

  // we should check again if there are any new matches with DB
  if (_collections.Products.find({
    handle: handle
  }).count() !== 0) {
    handle = createHandle(handle, productId);
  }

  return handle;
}

/**
 * @function copyMedia
 * @description copy images links to cloned variant from original
 * @param {String} newId - [cloned|original] product _id
 * @param {String} variantOldId - old variant _id
 * @param {String} variantNewId - - cloned variant _id
 * @return {Number} Media#update result
 */
function copyMedia(newId, variantOldId, variantNewId) {
  _collections.Media.find({
    "metadata.variantId": variantOldId
  }).forEach(function (fileObj) {
    // Copy File and insert directly, bypasing revision control
    (0, _api.copyFile)(fileObj, {
      productId: newId,
      variantId: variantNewId
    });
  });
}

/**
 * @function denormalize
 * @description With flattened model we do not want to get variant docs in
 * `products` publication, but we need some data from variants to display price,
 * quantity, etc. That's why we are denormalizing these properties into product
 * doc. Also, this way should have a speed benefit comparing the way where we
 * could dynamically build denormalization inside `products` publication.
 * @summary update product denormalized properties if variant was updated or
 * removed
 * @param {String} id - product _id
 * @param {String} field - type of field. Could be:
 * "price",
 * "inventoryQuantity",
 * "inventoryManagement",
 * "inventoryPolicy",
 * "lowInventoryWarningThreshold"
 * @since 0.11.0
 * @return {Number} - number of successful update operations. Should be "1".
 */
function denormalize(id, field) {
  var doc = _collections.Products.findOne(id);
  var variants = void 0;
  if (doc.type === "simple") {
    variants = _hooks.ProductRevision.getTopVariants(id);
  } else if (doc.type === "variant" && doc.ancestors.length === 1) {
    variants = _hooks.ProductRevision.getVariants(id);
  }
  var update = {};

  switch (field) {
    case "inventoryPolicy":
    case "inventoryQuantity":
    case "inventoryManagement":
      Object.assign(update, {
        isSoldOut: isSoldOut(variants),
        isLowQuantity: isLowQuantity(variants),
        isBackorder: isBackorder(variants)
      });
      break;
    case "lowInventoryWarningThreshold":
      Object.assign(update, {
        isLowQuantity: isLowQuantity(variants)
      });
      break;
    default:
      // "price" is object with range, min, max
      var priceObject = _hooks.ProductRevision.getProductPriceRange(id);
      Object.assign(update, {
        price: priceObject
      });
  }
  _collections.Products.update(id, {
    $set: update
  }, {
    selector: {
      type: "simple"
    }
  });
}

/**
 * isSoldOut
 * @description We are stop accepting new orders if product marked as
 * `isSoldOut`.
 * @param {Array} variants - Array with top-level variants
 * @return {Boolean} true if summary product quantity is zero.
 */
function isSoldOut(variants) {
  return variants.every(function (variant) {
    if (variant.inventoryManagement && variant.inventoryPolicy) {
      return _hooks.ProductRevision.getVariantQuantity(variant) <= 0;
    }
    return false;
  });
}

/**
 * isLowQuantity
 * @description If at least one of the variants is less than the threshold,
 * then function returns `true`
 * @param {Array} variants - array of child variants
 * @return {boolean} low quantity or not
 */
function isLowQuantity(variants) {
  return variants.some(function (variant) {
    var quantity = _hooks.ProductRevision.getVariantQuantity(variant);
    // we need to keep an eye on `inventoryPolicy` too and qty > 0
    if (variant.inventoryManagement && variant.inventoryPolicy && quantity) {
      return quantity <= variant.lowInventoryWarningThreshold;
    }
    // TODO: need to test this function with real data
    return false;
  });
}

/**
 * isBackorder
 * @description Is products variants is still available to be ordered after
 * summary variants quantity is zero
 * @param {Array} variants - array with variant objects
 * @return {boolean} is backorder allowed or now for a product
 */
function isBackorder(variants) {
  return variants.every(function (variant) {
    return !variant.inventoryPolicy && variant.inventoryManagement && variant.inventoryQuantity === 0;
  });
}

/**
 * flushQuantity
 * @description if variant `inventoryQuantity` not zero, function update it to
 * zero. This needed in case then option with it's own `inventoryQuantity`
 * creates to top-level variant. In that case top-level variant should display
 * sum of his options `inventoryQuantity` fields.
 * @param {String} id - variant _id
 * @return {Number} - collection update results
 */
function flushQuantity(id) {
  var variant = _collections.Products.findOne(id);
  // if variant already have descendants, quantity should be 0, and we don't
  // need to do all next actions
  if (variant.inventoryQuantity === 0) {
    return 1; // let them think that we have one successful operation here
  }

  return _collections.Products.update({
    _id: id
  }, {
    $set: {
      inventoryQuantity: 0
    }
  }, {
    selector: {
      type: "variant"
    }
  });
}

_meteor.Meteor.methods({
  /**
   * products/cloneVariant
   * @summary clones a product variant into a new variant
   * @description the method copies variants, but will also create and clone
   * child variants (options)
   * @param {String} productId - the productId we're whose variant we're
   * cloning
   * @param {String} variantId - the variantId that we're cloning
   * @todo rewrite @description
   * @return {Array} - list with cloned variants _ids
   */
  "products/cloneVariant": function productsCloneVariant(productId, variantId) {
    (0, _check.check)(productId, String);
    (0, _check.check)(variantId, String);
    // user needs createProduct permission to clone
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    var variant = _collections.Products.findOne(variantId);

    // Verify that this variant and any ancestors are not deleted.
    // Child variants cannot be added if a parent product or product revision
    // is marked as `{ isDeleted: true }`
    if (_api.ReactionProduct.isAncestorDeleted(variant, true)) {
      throw new _meteor.Meteor.Error(403, "Unable to create product variant");
    }

    var variants = _collections.Products.find({
      $or: [{
        _id: variantId
      }, {
        ancestors: {
          $in: [variantId]
        }
      }],
      type: "variant"
    }).fetch();
    // exit if we're trying to clone a ghost
    if (variants.length === 0) {
      return;
    }
    var variantNewId = Random.id(); // for the parent variant
    // we need to make sure that top level variant will be cloned first, his
    // descendants later.
    // we could use this way in future: http://stackoverflow.com/questions/
    // 9040161/mongo-order-by-length-of-array, by now following are allowed
    // @link https://lodash.com/docs#sortBy
    var sortedVariants = (0, _sortBy3.default)(variants, function (doc) {
      return doc.ancestors.length;
    });

    return sortedVariants.map(function (sortedVariant) {
      var oldId = sortedVariant._id;
      var type = "child";
      var clone = {};
      if (variantId === sortedVariant._id) {
        type = "parent";
        Object.assign(clone, sortedVariant, {
          _id: variantNewId,
          title: sortedVariant.title + " - copy"
        });
      } else {
        var parentIndex = sortedVariant.ancestors.indexOf(variantId);
        var ancestorsClone = sortedVariant.ancestors.slice(0);
        // if variantId exists in ancestors, we override it by new _id
        !!~parentIndex && ancestorsClone.splice(parentIndex, 1, variantNewId);
        Object.assign(clone, variant, {
          _id: Random.id(),
          ancestors: ancestorsClone
        });
      }
      delete clone.updatedAt;
      delete clone.createdAt;
      delete clone.inventoryQuantity;
      copyMedia(productId, oldId, clone._id);
      return _collections.Products.insert(clone, {
        validate: false
      }, function (error, result) {
        if (result) {
          if (type === "child") {
            _api2.Logger.debug("products/cloneVariant: created sub child clone: " + clone._id + " from " + variantId);
          } else {
            _api2.Logger.debug("products/cloneVariant: created clone: " + clone._id + " from " + variantId);
          }
        }
        if (error) {
          _api2.Logger.error("products/cloneVariant: cloning of " + variantId + " was failed: " + error);
        }
      });
    });
  },

  /**
   * products/createVariant
   * @summary initializes empty variant template
   * @param {String} parentId - the product _id or top level variant _id where
   * we create variant
   * @param {Object} [newVariant] - variant object
   * @return {String} new variantId
   */
  "products/createVariant": function productsCreateVariant(parentId, newVariant) {
    (0, _check.check)(parentId, String);
    (0, _check.check)(newVariant, Match.Optional(Object));
    // must have createProduct permissions
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    var newVariantId = Random.id();
    // get parent ancestors to build new ancestors array
    var product = _collections.Products.findOne(parentId);
    var ancestors = product.ancestors;

    // Verify that the parent variant and any ancestors are not deleted.
    // Child variants cannot be added if a parent product or product revision
    // is marked as `{ isDeleted: true }`

    if (_api.ReactionProduct.isAncestorDeleted(product, true)) {
      throw new _meteor.Meteor.Error(403, "Unable to create product variant");
    }

    Array.isArray(ancestors) && ancestors.push(parentId);
    var assembledVariant = Object.assign(newVariant || {}, {
      _id: newVariantId,
      ancestors: ancestors,
      type: "variant"
    });

    if (!newVariant) {
      Object.assign(assembledVariant, {
        title: "",
        price: 0.00
      });
    }

    // if we are inserting child variant to top-level variant, we need to remove
    // all top-level's variant inventory records and flush it's quantity,
    // because it will be hold sum of all it descendants quantities.
    if (ancestors.length === 2) {
      flushQuantity(parentId);
    }

    _collections.Products.insert(assembledVariant, function (error, result) {
      if (result) {
        _api2.Logger.debug("products/createVariant: created variant: " + newVariantId + " for " + parentId);
      }
    });

    return newVariantId;
  },

  /**
   * products/updateVariant
   * @summary update individual variant with new values, merges into original
   * only need to supply updated information. Currently used for a one use case
   * - to manage top-level variant autoform.
   * @param {Object} variant - current variant object
   * @todo some use cases of this method was moved to "products/
   * updateProductField", but it still used
   * @return {Number} returns update result
   */
  "products/updateVariant": function productsUpdateVariant(variant) {
    (0, _check.check)(variant, Object);
    // must have createProduct permissions
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    var currentVariant = _collections.Products.findOne(variant._id);
    // update variants
    if ((typeof currentVariant === "undefined" ? "undefined" : _typeof(currentVariant)) === "object") {
      var newVariant = Object.assign({}, currentVariant, variant);

      return _collections.Products.update({
        _id: variant._id
      }, {
        $set: newVariant // newVariant already contain `type` property, so we
        // do not need to pass it explicitly
      }, {
        validate: false
      }, function (error, result) {
        if (result) {
          var productId = currentVariant.ancestors[0];
          // we need manually check is these fields were updated?
          // we can't stop after successful denormalization, because we have a
          // case when several fields could be changed in top-level variant
          // before form will be submitted.
          toDenormalize.forEach(function (field) {
            if (currentVariant[field] !== variant[field]) {
              denormalize(productId, field);
            }
          });
        }
      });
    }
  },

  /**
   * products/deleteVariant
   * @summary delete variant, which should also delete child variants
   * @param {String} variantId - variantId to delete
   * @returns {Boolean} returns update results: `true` - if at least one variant
   * was removed or `false` if nothing was removed
   */
  "products/deleteVariant": function productsDeleteVariant(variantId) {
    (0, _check.check)(variantId, String);
    // must have createProduct permissions
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    var selector = {
      // Don't "archive" variants that are already marked deleted.
      isDeleted: {
        $in: [false, undefined]
      },
      $or: [{
        _id: variantId
      }, {
        ancestors: {
          $in: [variantId]
        }
      }]
    };
    var toDelete = _collections.Products.find(selector).fetch();
    // out if nothing to delete
    if (!Array.isArray(toDelete) || toDelete.length === 0) return false;

    var deleted = _collections.Products.remove(selector);

    // after variant were removed from product, we need to recalculate all
    // denormalized fields
    var productId = toDelete[0].ancestors[0];
    toDenormalize.forEach(function (field) {
      return denormalize(productId, field);
    });

    return typeof deleted === "number" && deleted > 0;
  },

  /**
   * products/cloneProduct
   * @summary clone a whole product, defaulting visibility, etc
   * in the future we are going to do an inheritance product
   * that maintains relationships with the cloned product tree
   * @param {Array} productOrArray - products array to clone
   * @returns {Array} returns insert results
   */
  "products/cloneProduct": function productsCloneProduct(productOrArray) {
    (0, _check.check)(productOrArray, Match.OneOf(Array, Object));
    // must have createProduct permissions
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }
    // this.unblock();

    var result = void 0;
    var products = void 0;
    var results = [];
    var pool = []; // pool of id pairs: { oldId, newId }

    function getIds(id) {
      return pool.filter(function (pair) {
        return pair.oldId === this.id;
      }, {
        id: id
      });
    }

    function setId(ids) {
      return pool.push(ids);
    }

    function buildAncestors(ancestors) {
      var newAncestors = [];
      ancestors.map(function (oldId) {
        var pair = getIds(oldId);
        // TODO do we always have newId on this step?
        newAncestors.push(pair[0].newId);
      });
      return newAncestors;
    }

    if (!Array.isArray(productOrArray)) {
      products = [productOrArray];
    } else {
      products = productOrArray;
    }

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = products[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var product = _step.value;

        // cloning product
        var productNewId = Random.id();
        setId({
          oldId: product._id,
          newId: productNewId
        });

        var newProduct = Object.assign({}, product, {
          _id: productNewId
          // ancestors: product.ancestors.push(product._id)
        });
        delete newProduct.updatedAt;
        delete newProduct.createdAt;
        delete newProduct.publishedAt;
        delete newProduct.positions;
        delete newProduct.handle;
        newProduct.isVisible = false;
        if (newProduct.title) {
          // todo test this
          newProduct.title = createTitle(newProduct.title, newProduct._id);
          newProduct.handle = createHandle(_api2.Reaction.getSlug(newProduct.title), newProduct._id);
        }
        result = _collections.Products.insert(newProduct, {
          validate: false
        });
        results.push(result);

        // cloning variants
        var variants = _collections.Products.find({
          ancestors: {
            $in: [product._id]
          },
          type: "variant"
        }).fetch();
        // why we are using `_.sortBy` described in `products/cloneVariant`
        var sortedVariants = (0, _sortBy3.default)(variants, function (doc) {
          return doc.ancestors.length;
        });
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = sortedVariants[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var variant = _step2.value;

            var variantNewId = Random.id();
            setId({
              oldId: variant._id,
              newId: variantNewId
            });
            var ancestors = buildAncestors(variant.ancestors);
            var newVariant = Object.assign({}, variant, {
              _id: variantNewId,
              ancestors: ancestors
            });
            delete newVariant.updatedAt;
            delete newVariant.createdAt;
            delete newVariant.publishedAt; // TODO can variant have this param?

            result = _collections.Products.insert(newVariant, {
              validate: false
            });
            copyMedia(productNewId, variant._id, variantNewId);
            results.push(result);
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

    return results;
  },

  /**
   * products/createProduct
   * @summary when we create a new product, we create it with an empty variant.
   * all products have a variant with pricing and details
   * @param {Object} [product] - optional product object
   * @return {String} return insert result
   */
  "products/createProduct": function productsCreateProduct(product) {
    (0, _check.check)(product, Match.Optional(Object));
    // must have createProduct permission
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    // if a product object was provided
    if (product) {
      return _collections.Products.insert(product);
    }

    return _collections.Products.insert({
      type: "simple" // needed for multi-schema
    }, {
      validate: false
    }, function (error, result) {
      // additionally, we want to create a variant to a new product
      if (result) {
        _collections.Products.insert({
          ancestors: [result],
          price: 0.00,
          title: "",
          type: "variant" // needed for multi-schema
        });
      }
    });
  },

  /**
   * products/archiveProduct
   * @summary archive a product and unlink it from all media
   * @param {String} productId - productId to delete
   * @returns {Number} returns number of removed products
   */
  "products/archiveProduct": function productsArchiveProduct(productId) {
    (0, _check.check)(productId, Match.OneOf(Array, String));
    // must have admin permission to delete
    if (!_api2.Reaction.hasPermission("createProduct") && !_api2.Reaction.hasAdminAccess()) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    var productIds = void 0;

    if (!Array.isArray(productId)) {
      productIds = [productId];
    } else {
      productIds = productId;
    }
    var productsWithVariants = _collections.Products.find({
      // Don't "archive" products that are already marked deleted.
      isDeleted: {
        $in: [false, undefined]
      },
      $or: [{
        _id: {
          $in: productIds
        }
      }, {
        ancestors: {
          $in: productIds
        }
      }]
    }, {
      fields: {
        type: 1
      }
    }).fetch();

    var ids = [];
    productsWithVariants.map(function (doc) {
      ids.push(doc._id);
    });

    _collections.Products.remove({
      _id: {
        $in: ids
      }
    });

    var numRemoved = _collections.Revisions.find({
      "documentId": {
        $in: ids
      },
      "documentData.isDeleted": true
    }).count();

    if (numRemoved > 0) {
      // we can get removes results only in async way
      _collections.Media.update({
        "metadata.productId": {
          $in: ids
        },
        "metadata.variantId": {
          $in: ids
        }
      }, {
        $set: {
          "metadata.isDeleted": true
        }
      });
      return numRemoved;
    }
    throw new _meteor.Meteor.Error(304, "Something went wrong, nothing was deleted");
  },

  /**
   * products/updateProductField
   * @summary update single product or variant field
   * @param {String} _id - product._id or variant._id to update
   * @param {String} field - key to update
   * @param {*} value - update property value
   * @todo rename it to something like "products/updateField" to  reflect
   * @todo we need to know which type of entity field belongs. For that we could
   * do something like: const type = Products.findOne(_id).type or transmit type
   * as param if it possible
   * latest changes. its used for products and variants
   * @return {Number} returns update result
   */
  "products/updateProductField": function productsUpdateProductField(_id, field, value) {
    (0, _check.check)(_id, String);
    (0, _check.check)(field, String);
    (0, _check.check)(value, Match.OneOf(String, Object, Array, Boolean, Number));
    // must have createProduct permission
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    var doc = _collections.Products.findOne(_id);
    var type = doc.type;
    var update = void 0;
    // handle booleans with correct typing
    if (value === "false" || value === "true") {
      update = _ejson.EJSON.parse("{" + field + ":" + value + "}");
    } else {
      var stringValue = _ejson.EJSON.stringify(value);
      update = _ejson.EJSON.parse("{\"" + field + "\":" + stringValue + "}");
    }

    // we need to use sync mode here, to return correct error and result to UI
    var result = void 0;

    try {
      result = _collections.Products.update(_id, {
        $set: update
      }, {
        selector: {
          type: type
        }
      });
    } catch (e) {
      throw new _meteor.Meteor.Error(e.message);
    }

    // If we get a result from the product update,
    // meaning the update went past revision control,
    // denormalize and attach results to top-level product
    if (result === 1) {
      if (type === "variant" && ~toDenormalize.indexOf(field)) {
        denormalize(doc.ancestors[0], field);
      }
    }
    return result;
  },

  /**
   * products/updateProductTags
   * @summary method to insert or update tag with hierarchy
   * @param {String} productId - productId
   * @param {String} tagName - tagName
   * @param {String} tagId - tagId
   * @return {Number} return result
   */
  "products/updateProductTags": function productsUpdateProductTags(productId, tagName, tagId) {
    (0, _check.check)(productId, String);
    (0, _check.check)(tagName, String);
    (0, _check.check)(tagId, Match.OneOf(String, null));
    // must have createProduct permission
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }
    this.unblock();

    var newTag = {
      slug: _api2.Reaction.getSlug(tagName),
      name: tagName
    };

    var existingTag = _collections.Tags.findOne({
      slug: _api2.Reaction.getSlug(tagName)
    });

    if (existingTag) {
      var productCount = _collections.Products.find({
        _id: productId,
        hashtags: {
          $in: [existingTag._id]
        }
      }).count();
      if (productCount > 0) {
        throw new _meteor.Meteor.Error(403, "Existing Tag, Update Denied");
      }
      return _collections.Products.update(productId, {
        $push: {
          hashtags: existingTag._id
        }
      }, {
        selector: {
          type: "simple"
        }
      });
    } else if (tagId) {
      return _collections.Tags.update(tagId, {
        $set: newTag
      });
    }

    var newTagId = _meteor.Meteor.call("shop/createTag", tagName, false);

    // if result is an Error object, we return it immediately
    if (typeof newTagId !== "string") {
      return newTagId;
    }

    return _collections.Products.update(productId, {
      $push: {
        hashtags: newTagId
      }
    }, {
      selector: {
        type: "simple"
      }
    });
  },

  /**
   * products/removeProductTag
   * @summary method to remove tag from product
   * @param {String} productId - productId
   * @param {String} tagId - tagId
   * @return {String} return update result
   */
  "products/removeProductTag": function productsRemoveProductTag(productId, tagId) {
    (0, _check.check)(productId, String);
    (0, _check.check)(tagId, String);
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    _collections.Products.update(productId, {
      $pull: {
        hashtags: tagId
      }
    }, {
      selector: {
        type: "simple"
      }
    });
  },

  /**
   * products/setHandle
   * @summary copy of "products/setHandleTag", but without tag
   * @param {String} productId - productId
   * @returns {String} handle - product handle
   */
  "products/setHandle": function productsSetHandle(productId) {
    (0, _check.check)(productId, String);
    // must have createProduct permission
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    var product = _collections.Products.findOne(productId);
    var handle = _api2.Reaction.getSlug(product.title);
    handle = createHandle(handle, product._id);
    _collections.Products.update(product._id, {
      $set: {
        handle: handle,
        type: "simple"
      }
    });

    return handle;
  },

  /**
   * products/setHandleTag
   * @summary set or toggle product handle
   * @param {String} productId - productId
   * @param {String} tagId - tagId
   * @return {String} return update result
   */
  "products/setHandleTag": function productsSetHandleTag(productId, tagId) {
    (0, _check.check)(productId, String);
    (0, _check.check)(tagId, String);
    // must have createProduct permission
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    function getSet(handle) {
      return {
        $set: {
          handle: handle,
          type: "simple"
        }
      };
    }

    var product = _collections.Products.findOne(productId);
    var tag = _collections.Tags.findOne(tagId);
    // set handle
    if (product.handle === tag.slug) {
      var handle = _api2.Reaction.getSlug(product.title);
      handle = createHandle(handle, product._id);
      _collections.Products.update(product._id, getSet(handle));

      return handle;
    }
    // toggle handle
    var existingHandles = _collections.Products.find({
      handle: tag.slug
    }).fetch();
    // this is needed to take care about product's handle which(product) was
    // previously tagged.
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = existingHandles[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var currentProduct = _step3.value;

        var currentProductHandle = createHandle(_api2.Reaction.getSlug(currentProduct.title), currentProduct._id);
        _collections.Products.update(currentProduct._id, getSet(currentProductHandle));
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

    _collections.Products.update(product._id, getSet(tag.slug));

    return tag.slug;
  },

  /**
   * products/updateProductPosition
   * @summary update product grid positions
   * @param {String} productId - productId
   * @param {Object} positionData -  an object with position,dimensions
   * @param {String} tag - current route name. If it is not tag, then we using
   * shop name as base `positions` name. Could be useful for multi-shopping.
   * @return {Number} collection update returns
   */
  "products/updateProductPosition": function productsUpdateProductPosition(productId, positionData, tag) {
    var _$set;

    (0, _check.check)(productId, String);
    (0, _check.check)(positionData, Object);
    (0, _check.check)(tag, String);
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }
    this.unblock();

    var position = "positions." + tag + ".position";
    var pinned = "positions." + tag + ".pinned";
    var weight = "positions." + tag + ".weight";
    var updatedAt = "positions." + tag + ".updatedAt";

    return _collections.Products.update({
      _id: productId
    }, {
      $set: (_$set = {}, _defineProperty(_$set, position, positionData.position), _defineProperty(_$set, pinned, positionData.pinned), _defineProperty(_$set, weight, positionData.weight), _defineProperty(_$set, updatedAt, new Date()), _defineProperty(_$set, "type", "simple"), _$set)
    });
  },

  /**
   * products/updateVariantsPosition
   * @description updates top level variant position index
   * @param {Array} sortedVariantIds - array of top level variant `_id`s
   * @since 0.11.0
   * @return {Number} Products.update result
   */
  "products/updateVariantsPosition": function productsUpdateVariantsPosition(sortedVariantIds) {
    (0, _check.check)(sortedVariantIds, [String]);
    // TODO: to make this work we need to remove auditArgumentsCheck I suppose
    // new SimpleSchema({
    //   sortedVariantIds: { type: [String] }
    // }).validate({ sortedVariantIds });

    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    sortedVariantIds.forEach(function (id, index) {
      _collections.Products.update(id, {
        $set: {
          index: index
        }
      }, {
        selector: {
          type: "variant"
        }
      }, function (error, result) {
        if (result) {
          _api2.Logger.debug("Variant " + id + " position was updated to index " + index);
        }
      });
    });
  },

  /**
   * products/updateMetaFields
   * @summary update product metafield
   * @param {String} productId - productId
   * @param {Object} updatedMeta - update object with metadata
   * @param {Object|Number|undefined|null} meta - current meta object, or a number index
   * @todo should this method works for variants also?
   * @return {Number} collection update result
   */
  "products/updateMetaFields": function productsUpdateMetaFields(productId, updatedMeta, meta) {
    (0, _check.check)(productId, String);
    (0, _check.check)(updatedMeta, Object);
    (0, _check.check)(meta, Match.OneOf(Object, Number, undefined, null));
    // must have createProduct permission
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    // update existing metadata
    if ((typeof meta === "undefined" ? "undefined" : _typeof(meta)) === "object") {
      return _collections.Products.update({
        _id: productId,
        metafields: meta
      }, {
        $set: {
          "metafields.$": updatedMeta
        }
      }, {
        selector: {
          type: "simple"
        }
      });
    } else if (typeof meta === "number") {
      return _collections.Products.update({
        _id: productId
      }, {
        $set: _defineProperty({}, "metafields." + meta, updatedMeta)
      }, {
        selector: {
          type: "simple"
        }
      });
    }

    // adds metadata
    return _collections.Products.update({
      _id: productId
    }, {
      $addToSet: {
        metafields: updatedMeta
      }
    }, {
      selector: {
        type: "simple"
      }
    });
  },

  /**
   * products/removeMetaFields
   * @summary update product metafield
   * @param {String} productId - productId
   * @param {Object} metafields - metadata object to remove
   * @param {Object} type - optional product type for schema selection
   * @return {Number} collection update result
   */
  "products/removeMetaFields": function productsRemoveMetaFields(productId, metafields) {
    var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "simple";

    (0, _check.check)(productId, String);
    (0, _check.check)(metafields, Object);
    (0, _check.check)(type, String);

    // must have createProduct permission
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    return _collections.Products.update({
      _id: productId,
      type: type
    }, {
      $pull: {
        metafields: metafields
      }
    });
  },

  /**
   * products/publishProduct
   * @summary publish (visibility) of product
   * @todo hook into publishing flow
   * @param {String} productId - productId
   * @return {Boolean} product.isVisible
   */
  "products/publishProduct": function productsPublishProduct(productId) {
    (0, _check.check)(productId, String);
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    var product = _collections.Products.findOne(productId);
    var variants = _collections.Products.find({
      ancestors: {
        $in: [productId]
      }
    }).fetch();
    var variantValidator = true;

    if ((typeof product === "undefined" ? "undefined" : _typeof(product)) === "object" && product.title.length > 1) {
      if (variants.length > 0) {
        variants.forEach(function (variant) {
          // if this is a top variant with children, we avoid it to check price
          // because we using price of its children
          if (variant.ancestors.length === 1 && !_hooks.ProductRevision.getVariants(variant._id, "variant").length || variant.ancestors.length !== 1) {
            if (!(typeof variant.price === "number" && variant.price > 0)) {
              variantValidator = false;
            }
          }
          // if variant has no title
          if (typeof variant.title === "string" && !variant.title.length) {
            variantValidator = false;
          }
          if (typeof optionTitle === "string" && !optionTitle.length) {
            variantValidator = false;
          }
        });
      } else {
        _api2.Logger.debug("invalid product visibility ", productId);
        throw new _meteor.Meteor.Error(403, "Forbidden", "Variant is required");
      }

      if (!variantValidator) {
        _api2.Logger.debug("invalid product visibility ", productId);
        throw new _meteor.Meteor.Error(403, "Forbidden", "Some properties are missing.");
      }

      // update product visibility
      _api2.Logger.debug("toggle product visibility ", product._id, !product.isVisible);

      var res = _collections.Products.update(product._id, {
        $set: {
          isVisible: !product.isVisible
        }
      }, {
        selector: {
          type: "simple"
        }
      });
      // update product variants visibility
      updateVariantProductField(variants, "isVisible", !product.isVisible);
      // if collection updated we return new `isVisible` state
      return res === 1 && !product.isVisible;
    }
    _api2.Logger.debug("invalid product visibility ", productId);
    throw new _meteor.Meteor.Error(400, "Bad Request");
  },
  /**
   * products/publishProduct
   * @summary publish (visibility) of product
   * @todo hook into publishing flow
   * @param {String} productId - productId
   * @return {Boolean} product.isVisible
   */
  "products/toggleVisibility": function productsToggleVisibility(productId) {
    (0, _check.check)(productId, String);
    if (!_api2.Reaction.hasPermission("createProduct")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    var product = _collections.Products.findOne(productId);
    var res = _collections.Products.update(productId, {
      $set: {
        isVisible: !product.isVisible
      }
    }, {
      selector: {
        type: product.type
      }
    });

    if (Array.isArray(product.ancestors) && product.ancestors.length) {
      var updateId = product.ancestors[0] || product._id;
      var updatedPriceRange = _api.ReactionProduct.getProductPriceRange(updateId);

      _meteor.Meteor.call("products/updateProductField", updateId, "price", updatedPriceRange);
    }

    // if collection updated we return new `isVisible` state
    return res === 1 && !product.isVisible;
  }
});