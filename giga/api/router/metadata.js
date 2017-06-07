"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MetaData = undefined;

var _kadiraDochead = require("meteor/kadira:dochead");

var _api = require("/lib/api");

var _collections = require("/lib/collections");

/**
 * MetaData
 * populates title and meta tags for routes
 * init accepts Router.current() context
 */
var MetaData = exports.MetaData = {
  init: function init(context) {
    var params = context.params;
    var product = _api.ReactionProduct.selectedProduct();
    var shop = _collections.Shops.findOne((0, _api.getShopId)());
    var meta = [];
    var title = "";
    var keywords = [];

    // case helper
    var titleCase = function titleCase(param) {
      return param.charAt(0).toUpperCase() + param.substring(1);
    };

    // populate meta from shop
    if (shop) {
      //
      // shop defaults
      //
      if (shop && shop.description) {
        _kadiraDochead.DocHead.addMeta({
          name: "description",
          content: shop.description.substring(0, 160)
        });
      }
      if (shop && shop.keywords) {
        _kadiraDochead.DocHead.addMeta({
          name: "keywords",
          content: shop.keywords.toString()
        });
      }

      //
      // set title defaults
      //
      MetaData.name = shop.name;
      // product title default
      if (params && params.handle) {
        if (product && product.title) {
          title = titleCase(product.title);
        } else {
          title = titleCase(params.handle);
        }
        // tag slugs
      } else if (params && params.slug) {
        title = titleCase(params.slug);
        // fallback to route name
      } else if (context.route && context.route.name) {
        var route = context.route;
        var routeName = route.name;
        // default index to Shop Name
        if (routeName === "index") {
          title = titleCase(shop.name);
          // check for meta in package route
        } else if (route.options.meta && route.options.meta.title) {
          title = titleCase(route.options.meta.title);
        } else {
          // default routes to route's name
          title = titleCase(routeName);
        }
      }

      //
      //  product details
      //
      if (params && params.handle && product) {
        // discard defaults
        _kadiraDochead.DocHead.removeDocHeadAddedTags();

        if (product.description) {
          _kadiraDochead.DocHead.addMeta({
            name: "description",
            content: product.description.substring(0, 160)
          });
        }

        if (product && product.metafields) {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = product.metafields[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var key = _step.value;

              keywords.push(key.value);
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

        if (keywords) {
          _kadiraDochead.DocHead.addMeta({
            name: "keywords",
            content: keywords.toString()
          });
        }
      }

      // set site defaults
      _kadiraDochead.DocHead.setTitle(title);
      MetaData.title = title;
      MetaData.meta = meta;
      return meta;
    } // end shop
  } // end update

};