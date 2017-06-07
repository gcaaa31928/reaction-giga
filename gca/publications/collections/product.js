"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.findProductMedia = findProductMedia;

var _collections = require("/lib/collections");

var _api = require("/server/api");

var _revisions = require("/imports/plugins/core/revisions/lib/api/revisions");

function findProductMedia(publicationInstance, productIds) {
  var shopId = _api.Reaction.getShopId();
  var selector = {};

  if (!shopId) {
    return publicationInstance.ready();
  }

  if (Array.isArray(productIds)) {
    selector["metadata.productId"] = {
      $in: productIds
    };
  } else {
    selector["metadata.productId"] = productIds;
  }

  if (shopId) {
    selector["metadata.shopId"] = shopId;
  }

  // No one needs to see archived images on products
  selector["metadata.workflow"] = {
    $nin: ["archived"]
  };

  // Product editors can see both published and unpublished images
  if (!_api.Reaction.hasPermission(["createProduct"], publicationInstance.userId)) {
    selector["metadata.workflow"].$in = [null, "published"];
  }

  return _collections.Media.find(selector, {
    sort: {
      "metadata.priority": 1
    }
  });
}

/**
 * product detail publication
 * @param {String} productId - productId or handle
 * @return {Object} return product cursor
 */
Meteor.publish("Product", function (productId) {
  var _this = this;

  check(productId, Match.OptionalOrNull(String));
  if (!productId) {
    _api.Logger.debug("ignoring null request on Product subscription");
    return this.ready();
  }
  var _id = void 0;
  var shop = _api.Reaction.getCurrentShop();
  // verify that shop is ready
  if ((typeof shop === "undefined" ? "undefined" : _typeof(shop)) !== "object") {
    return this.ready();
  }

  var selector = {};
  selector.isVisible = true;
  selector.isDeleted = { $in: [null, false] };

  if (Roles.userIsInRole(this.userId, ["owner", "admin", "createProduct"], shop._id)) {
    selector.isVisible = {
      $in: [true, false]
    };
  }
  // TODO review for REGEX / DOS vulnerabilities.
  if (productId.match(/^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17}$/)) {
    selector._id = productId;
    // TODO try/catch here because we can have product handle passed by such regex
    _id = productId;
  } else {
    selector.handle = {
      $regex: productId,
      $options: "i"
    };
    var products = _collections.Products.find(selector).fetch();
    if (products.length > 0) {
      _id = products[0]._id;
    } else {
      return this.ready();
    }
  }

  // Selector for hih?
  selector = {
    isVisible: true,
    isDeleted: { $in: [null, false] },
    $or: [{ handle: _id }, { _id: _id }, {
      ancestors: {
        $in: [_id]
      }
    }]
  };

  // Authorized content curators fo the shop get special publication of the product
  // all all relevant revisions all is one package
  if (Roles.userIsInRole(this.userId, ["owner", "admin", "createProduct"], shop._id)) {
    selector.isVisible = {
      $in: [true, false, undefined]
    };

    if (_revisions.RevisionApi.isRevisionControlEnabled()) {
      var _productCursor2 = _collections.Products.find(selector);
      var _productIds2 = _productCursor2.map(function (p) {
        return p._id;
      });

      var handle = _productCursor2.observeChanges({
        added: function added(id, fields) {
          var revisions = _collections.Revisions.find({
            "documentId": id,
            "workflow.status": {
              $nin: ["revision/published"]
            }
          }).fetch();
          fields.__revisions = revisions;

          _this.added("Products", id, fields);
        },
        changed: function changed(id, fields) {
          var revisions = _collections.Revisions.find({
            "documentId": id,
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
          if (!revision.parentDocument) {
            product = _collections.Products.findOne(revision.documentId);
          } else {
            product = _collections.Products.findOne(revision.parentDocument);
          }
          if (product) {
            _this.added("Products", product._id, product);
            _this.added("Revisions", revision._id, revision);
          }
        },
        changed: function changed(revision) {
          var product = void 0;
          if (!revision.parentDocument) {
            product = _collections.Products.findOne(revision.documentId);
          } else {
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
          if (!revision.parentDocument) {
            product = _collections.Products.findOne(revision.documentId);
          } else {
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

      return [findProductMedia(this, _productIds2)];
    }

    // Revision control is disabled, but is an admin
    var _productCursor = _collections.Products.find(selector);
    var _productIds = _productCursor.map(function (p) {
      return p._id;
    });
    var _mediaCursor = findProductMedia(this, _productIds);

    return [_productCursor, _mediaCursor];
  }

  // Everyone else gets the standard, visibile products and variants
  var productCursor = _collections.Products.find(selector);
  var productIds = productCursor.map(function (p) {
    return p._id;
  });
  var mediaCursor = findProductMedia(this, productIds);

  return [productCursor, mediaCursor];
});