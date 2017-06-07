"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _collections = require("/lib/collections");

var _api = require("/server/api");

var _revisions = require("/imports/plugins/core/revisions/lib/api/revisions");

var _product = require("./product");

//
// define search filters as a schema so we can validate
// params supplied to the products publication
//
var filters = new SimpleSchema({
  "shops": {
    type: [String],
    optional: true
  },
  "tags": {
    type: [String],
    optional: true
  },
  "query": {
    type: String,
    optional: true
  },
  "visibility": {
    type: Boolean,
    optional: true
  },
  "details": {
    type: Object,
    optional: true
  },
  "details.key": {
    type: String,
    optional: true
  },
  "details.value": {
    type: String,
    optional: true
  },
  "price": {
    type: Object,
    optional: true
  },
  "price.min": {
    type: String,
    optional: true
  },
  "price.max": {
    type: String,
    optional: true
  },
  "weight": {
    type: Object,
    optional: true
  },
  "weight.min": {
    type: String,
    optional: true
  },
  "weight.max": {
    type: String,
    optional: true
  }
});

/**
 * products publication
 * @param {Number} productScrollLimit - optional, defaults to 24
 * @param {Array} shops - array of shopId to retrieve product from.
 * @return {Object} return product cursor
 */
Meteor.publish("Products", function () {
  var productScrollLimit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 24;

  var _this = this;

  var productFilters = arguments[1];
  var sort = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  check(productScrollLimit, Number);
  check(productFilters, Match.OneOf(undefined, Object));
  check(sort, Match.OneOf(undefined, Object));

  // if there are filter/params that don't match the schema
  // validate, catch except but return no results
  try {
    check(productFilters, Match.OneOf(undefined, filters));
  } catch (e) {
    _api.Logger.debug(e, "Invalid Product Filters");
    return this.ready();
  }
  // ensure that we've got a shop instance
  var shop = _api.Reaction.getCurrentShop();
  if ((typeof shop === "undefined" ? "undefined" : _typeof(shop)) !== "object") {
    return this.ready();
  }

  if (shop) {
    var selector = {};
    if (Roles.userIsInRole(this.userId, ["owner", "admin", "createProduct"], shop._id)) {
      _.extend(selector, {
        isDeleted: { $in: [null, false] },
        ancestors: { $exists: true },
        shopId: shop._id
      });
    } else {
      // Changing the selector for non admin users only. To get top-level products.
      _.extend(selector, {
        isDeleted: { $in: [null, false] },
        ancestors: [],
        shopId: shop._id
      });
    }

    if (productFilters) {
      // handle multiple shops
      if (productFilters.shops) {
        _.extend(selector, {
          shopId: {
            $in: productFilters.shops
          }
        });

        // check if this user is a shopAdmin
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = productFilters.shops[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var thisShopId = _step.value;

            if (Roles.userIsInRole(this.userId, ["admin", "createProduct"], thisShopId)) {
              shopAdmin = true;
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
      }

      // filter by tags
      if (productFilters.tags) {
        _.extend(selector, {
          hashtags: {
            $in: productFilters.tags
          }
        });
      }

      // filter by query
      if (productFilters.query) {
        var cond = {
          $regex: productFilters.query,
          $options: "i"
        };
        _.extend(selector, {
          $or: [{
            title: cond
          }, {
            pageTitle: cond
          }, {
            description: cond
          }]
        });
      }

      // filter by details
      if (productFilters.details) {
        _.extend(selector, {
          metafields: {
            $elemMatch: {
              key: {
                $regex: productFilters.details.key,
                $options: "i"
              },
              value: {
                $regex: productFilters.details.value,
                $options: "i"
              }
            }
          }
        });
      }

      // filter by visibility
      if (productFilters.visibility !== undefined) {
        _.extend(selector, {
          isVisible: productFilters.visibility
        });
      }

      // filter by gte minimum price
      if (productFilters["price.min"] && !productFilters["price.max"]) {
        _.extend(selector, {
          "price.min": {
            $gte: parseFloat(productFilters["price.min"])
          }
        });
      }

      // filter by lte maximum price
      if (productFilters["price.max"] && !productFilters["price.min"]) {
        _.extend(selector, {
          "price.max": {
            $lte: parseFloat(productFilters["price.max"])
          }
        });
      }

      // filter with a price range
      if (productFilters["price.min"] && productFilters["price.max"]) {
        var pmin = parseFloat(productFilters["price.min"]);
        var pmax = parseFloat(productFilters["price.max"]);
        // where product A has min 12.99 variant and a 19.99 variant
        // price.min=12.99&price.max=19.98
        // should return product A
        _.extend(selector, {
          "price.min": {
            $lt: pmax
          },
          "price.max": {
            $gt: pmin
          }
        });
      }

      // filter by gte minimum weight
      if (productFilters["weight.min"] && !productFilters["weight.max"]) {
        _.extend(selector, {
          weight: {
            $gte: parseFloat(productFilters["weight.min"])
          }
        });
      }

      // filter by lte maximum weight
      if (productFilters["weight.max"] && !productFilters["weight.min"]) {
        _.extend(selector, {
          weight: {
            $lte: parseFloat(productFilters["weight.max"])
          }
        });
      }

      // filter with a weight range
      if (productFilters["weight.min"] && productFilters["weight.max"]) {
        var wmin = parseFloat(productFilters["weight.min"]);
        var wmax = parseFloat(productFilters["weight.max"]);
        _.extend(selector, {
          weight: {
            $lt: wmax,
            $gt: wmin
          }
        });
      }
    } // end if productFilters

    // Authorized content curators fo the shop get special publication of the product
    // with all relevant revisions all is one package

    if (Roles.userIsInRole(this.userId, ["owner", "admin", "createProduct"], shop._id)) {
      selector.isVisible = {
        $in: [true, false, undefined]
      };

      // Get _ids of top-level products
      var _productIds = _collections.Products.find(selector, {
        sort: sort,
        limit: productScrollLimit
      }).map(function (product) {
        return product._id;
      });

      var _newSelector = selector;

      // Remove hashtag filter from selector (hashtags are not applied to variants, we need to get variants)
      if (productFilters && productFilters.tags) {
        _newSelector = _.omit(selector, ["hashtags"]);

        // Re-configure selector to pick either Variants of one of the top-level products, or the top-level products in the filter
        _.extend(_newSelector, {
          $or: [{
            ancestors: {
              $in: _productIds
            }
          }, {
            hashtags: {
              $in: productFilters.tags
            }
          }]
        });
      }

      if (_revisions.RevisionApi.isRevisionControlEnabled()) {
        var _productCursor2 = _collections.Products.find(_newSelector);
        var handle = _productCursor2.observeChanges({
          added: function added(id, fields) {
            var revisions = _collections.Revisions.find({
              "$or": [{ documentId: id }, { parentDocument: id }],
              "workflow.status": {
                $nin: ["revision/published"]
              }
            }).fetch();
            fields.__revisions = revisions;

            _this.added("Products", id, fields);
          },
          changed: function changed(id, fields) {
            var revisions = _collections.Revisions.find({
              "$or": [{ documentId: id }, { parentDocument: id }],
              "workflow.status": {
                $nin: ["revision/published"]
              }
            }).fetch();

            fields.__revisions = revisions;
            _this.changed("Products", id, fields);
          },
          removed: function removed(id) {
            _this.removed("Products", id);
          }
        });

        var handle2 = _collections.Revisions.find({
          "workflow.status": {
            $nin: ["revision/published"]
          }
        }).observe({
          added: function added(revision) {
            var product = void 0;
            if (!revision.documentType || revision.documentType === "product") {
              product = _collections.Products.findOne(revision.documentId);
            } else if (revision.documentType === "image" || revision.documentType === "tag") {
              product = _collections.Products.findOne(revision.parentDocument);
            }

            if (product) {
              _this.added("Products", product._id, product);
              _this.added("Revisions", revision._id, revision);
            }
          },
          changed: function changed(revision) {
            var product = void 0;
            if (!revision.documentType || revision.documentType === "product") {
              product = _collections.Products.findOne(revision.documentId);
            } else if (revision.documentType === "image" || revision.documentType === "tag") {
              product = _collections.Products.findOne(revision.parentDocument);
            }
            if (product) {
              product.__revisions = [revision];
              _this.changed("Products", product._id, product);
              _this.changed("Revisions", revision._id, revision);
            }
          },
          removed: function removed(revision) {
            var product = void 0;

            if (!revision.documentType || revision.documentType === "product") {
              product = _collections.Products.findOne(revision.documentId);
            } else if (revision.docuentType === "image" || revision.documentType === "tag") {
              product = _collections.Products.findOne(revision.parentDocument);
            }
            if (product) {
              product.__revisions = [];
              _this.changed("Products", product._id, product);
              _this.removed("Revisions", revision._id, revision);
            }
          }
        });

        this.onStop(function () {
          handle.stop();
          handle2.stop();
        });

        var _mediaProductIds2 = _productCursor2.fetch().map(function (p) {
          return p._id;
        });
        var _mediaCursor2 = (0, _product.findProductMedia)(this, _mediaProductIds2);

        return [_mediaCursor2];
      }
      // Revision control is disabled, but is admin
      var _productCursor = _collections.Products.find(_newSelector, {
        sort: sort,
        limit: productScrollLimit
      });
      var _mediaProductIds = _productCursor.fetch().map(function (p) {
        return p._id;
      });
      var _mediaCursor = (0, _product.findProductMedia)(this, _mediaProductIds);

      return [_productCursor, _mediaCursor];
    }

    // Everyone else gets the standard, visible products
    selector.isVisible = true;

    // Get _ids of top-level products
    var productIds = _collections.Products.find(selector, {
      sort: sort,
      limit: productScrollLimit
    }).map(function (product) {
      return product._id;
    });

    var newSelector = selector;

    // Remove hashtag filter from selector (hashtags are not applied to variants, we need to get variants)
    if (productFilters && productFilters.tags) {
      newSelector = _.omit(selector, ["hashtags"]);

      // Re-configure selector to pick either Variants of one of the top-level products, or the top-level products in the filter
      _.extend(newSelector, {
        $or: [{
          ancestors: {
            $in: productIds
          }
        }, {
          hashtags: {
            $in: productFilters.tags
          }
        }]
      });
    }
    // Returning Complete product tree for top level products to avoid sold out warning.
    var productCursor = _collections.Products.find({
      $or: [{ _id: { $in: productIds } }, { ancestors: { $in: productIds } }]
    });

    var mediaProductIds = productCursor.fetch().map(function (p) {
      return p._id;
    });
    var mediaCursor = (0, _product.findProductMedia)(this, mediaProductIds);

    return [productCursor, mediaCursor];
  }
});