"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.metaField = metaField;
exports.productVariant = productVariant;
exports.addProduct = addProduct;
exports.addProductSingleVariant = addProductSingleVariant;
exports.getProduct = getProduct;
exports.getProducts = getProducts;

exports.default = function () {
  /**
   * Tag Factory
   * @summary define tag Factory
   */
  Factory.define("tag", _collections.Tags, {
    name: "Tag",
    slug: "tag",
    position: _.random(0, 100000),
    //  relatedTagIds: [],
    isTopLevel: true,
    shopId: (0, _shops.getShop)()._id,
    createdAt: _faker2.default.date.past(),
    updatedAt: new Date()
  });

  /**
   * Product factory
   * @summary define product Factory
   */
  var base = {
    ancestors: [],
    shopId: (0, _shops.getShop)()._id
  };

  var priceRange = {
    range: "1.00 - 12.99",
    min: 1.00,
    max: 12.99
  };

  var product = {
    title: _faker2.default.commerce.productName(),
    pageTitle: _faker2.default.lorem.sentence(),
    description: _faker2.default.lorem.paragraph(),
    type: "simple",
    vendor: _faker2.default.company.companyName(),
    price: priceRange,
    isLowQuantity: false,
    isSoldOut: false,
    isBackorder: false,
    metafields: [],
    requiresShipping: true,
    // parcel: ?,
    hashtags: [],
    isVisible: _faker2.default.random.boolean(),
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  Factory.define("product", _collections.Products, Object.assign({}, base, product));
  Factory.define("variant", _collections.Products, {
    type: "variant"
  });
};

var _faker = require("faker");

var _faker2 = _interopRequireDefault(_faker);

var _collections = require("/lib/collections");

var _shops = require("./shops");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * ReactionFaker.metaField()
 *
 * @param   {Object} [options] - options object to override generated default values
 * @param   {string} [options.key] - metaField key
 * @param   {string} [options.value] - metaField value
 * @param   {string} [options.scope] - metaField scope
 * @returns {Object} - randomly generated metaField
 */
function metaField() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var defaults = {
    key: _faker2.default.commerce.productAdjective(),
    value: _faker2.default.commerce.productMaterial(),
    scope: "detail"
  };
  return _.defaults(options, defaults);
}

/**
 * ReactionFaker.productVariant()
 *
 * @param {Object} [options] - Options object
 * @param {string} [options._id] - id
 * @param {string} [options.parentId] - variant's parent's ID. Sets variant as child.
 * @param {string} [options.compareAtPrice] - MSRP Price / Compare At Price
 * @param {string} [options.weight] - productVariant weight
 * @param {string} [options.inventoryManagement] - Track inventory for this product?
 * @param {string} [options.inventoryPolicy] - Allow overselling of this product?
 * @param {string} [options.lowInventoryWarningThreshold] - Qty left of inventory that sets off warning
 * @param {string} [options.inventoryQuantity] - Inventory Quantity
 * @param {string} [options.price] - productVariant price
 * @param {string} [options.title] - productVariant title
 * @param {string} [options.optionTitle] - productVariant option title
 * @param {string} [options.sku] - productVariant sku
 * @param {string} [options.taxable] - is this productVariant taxable?
 * @param {Object[]} [options.metafields] - productVariant metaFields
 *
 * @returns {Object} - randomly generated productVariant
 */
function productVariant() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var defaults = {
    ancestors: [],
    compareAtPrice: _.random(0, 1000),
    weight: _.random(0, 10),
    inventoryManagement: _faker2.default.random.boolean(),
    inventoryPolicy: _faker2.default.random.boolean(),
    lowInventoryWarningThreshold: _.random(1, 5),
    inventoryQuantity: _.random(0, 100),
    price: _.random(10, 1000),
    title: _faker2.default.commerce.productName(),
    optionTitle: _faker2.default.commerce.productName(),
    shopId: (0, _shops.getShop)()._id,
    sku: _.random(0, 6),
    taxable: _faker2.default.random.boolean(),
    type: "variant",
    metafields: [metaField(), metaField({
      key: "facebook",
      scope: "socialMessages"
    }), metaField({
      key: "twitter",
      scope: "socialMessages"
    })]
  };
  return _.defaults(options, defaults);
}

function addProduct() {
  var product = Factory.create("product");
  // top level variant
  var variant = Factory.create("variant", Object.assign({}, productVariant(), { ancestors: [product._id] }));
  Factory.create("variant", Object.assign({}, productVariant(), { ancestors: [product._id, variant._id] }));
  Factory.create("variant", Object.assign({}, productVariant(), { ancestors: [product._id, variant._id] }));
  return product;
}

function addProductSingleVariant() {
  var product = Factory.create("product");
  // top level variant
  var variant = Factory.create("variant", Object.assign({}, productVariant(), { ancestors: [product._id] }));
  return { product: product, variant: variant };
}

function getProduct() {
  var existingProduct = _collections.Products.findOne();
  return existingProduct || Factory.create("product");
}

function getProducts() {
  var limit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;

  var products = [];
  var existingProducts = _collections.Products.find({}, { limit: limit }).fetch();
  for (var i = 0; i < limit; i = i + 1) {
    var product = existingProducts[i] || Factory.create("product");
    products.push(product);
  }
  return products;
}