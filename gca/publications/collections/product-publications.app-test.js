"use strict";

var _practicalmeteorChai = require("meteor/practicalmeteor:chai");

var _practicalmeteorSinon = require("meteor/practicalmeteor:sinon");

var _alanningRoles = require("meteor/alanning:roles");

var _shops = require("/server/imports/fixtures/shops");

var _api = require("/server/api");

var _collections = require("/lib/collections");

var Collections = _interopRequireWildcard(_collections);

var _fixtures = require("/server/imports/fixtures");

var _fixtures2 = _interopRequireDefault(_fixtures);

var _johanbrookPublicationCollector = require("meteor/johanbrook:publication-collector");

var _revisions = require("/imports/plugins/core/revisions/lib/api/revisions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

(0, _fixtures2.default)(); /* eslint dot-notation: 0 */


describe("Publication", function () {
  var shop = (0, _shops.getShop)();
  var sandbox = void 0;

  beforeEach(function () {
    sandbox = _practicalmeteorSinon.sinon.sandbox.create();
    sandbox.stub(_revisions.RevisionApi, "isRevisionControlEnabled", function () {
      return true;
    });
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("with products", function () {
    var priceRangeA = {
      range: "1.00 - 12.99",
      min: 1.00,
      max: 12.99
    };

    var priceRangeB = {
      range: "12.99 - 19.99",
      min: 12.99,
      max: 19.99
    };

    before(function () {
      Collections.Products.direct.remove({});

      // a product with price range A, and not visible
      Collections.Products.insert({
        ancestors: [],
        title: "My Little Pony",
        shopId: shop._id,
        type: "simple",
        price: priceRangeA,
        isVisible: false,
        isLowQuantity: false,
        isSoldOut: false,
        isBackorder: false
      });
      // a product with price range B, and visible
      Collections.Products.insert({
        ancestors: [],
        title: "Shopkins - Peachy",
        shopId: shop._id,
        price: priceRangeB,
        type: "simple",
        isVisible: true,
        isLowQuantity: false,
        isSoldOut: false,
        isBackorder: false
      });
      // a product with price range A, and visible
      Collections.Products.insert({
        ancestors: [],
        title: "Fresh Tomatoes",
        shopId: shop._id,
        price: priceRangeA,
        type: "simple",
        isVisible: true,
        isLowQuantity: false,
        isSoldOut: false,
        isBackorder: false
      });
    });

    describe("Products", function () {
      it("should return all products to admins", function (done) {
        // setup
        sandbox.stub(_api.Reaction, "getCurrentShop", function () {
          return shop;
        });
        sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
          return true;
        });

        var collector = new _johanbrookPublicationCollector.PublicationCollector({ userId: Random.id() });
        var isDone = false;

        collector.collect("Products", 24, undefined, {}, function (collections) {
          var products = collections.Products;
          (0, _practicalmeteorChai.expect)(products.length).to.equal(3);

          if (!isDone) {
            isDone = true;
            done();
          }
        });
      });

      it("should have an expected product title", function (done) {
        // setup
        sandbox.stub(_api.Reaction, "getCurrentShop", function () {
          return shop;
        });
        sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
          return true;
        });

        var collector = new _johanbrookPublicationCollector.PublicationCollector({ userId: Random.id() });
        var isDone = false;

        collector.collect("Products", 24, undefined, {}, function (collections) {
          var products = collections.Products;
          var data = products[1];
          var expectedTitles = ["My Little Pony", "Shopkins - Peachy"];

          (0, _practicalmeteorChai.expect)(expectedTitles.some(function (title) {
            return title === data.title;
          })).to.be.ok;

          if (!isDone) {
            isDone = true;
            done();
          }
        });
      });

      it("should return only visible products to visitors", function (done) {
        sandbox.stub(_api.Reaction, "getCurrentShop", function () {
          return shop;
        });
        sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
          return false;
        });

        var collector = new _johanbrookPublicationCollector.PublicationCollector({ userId: Random.id() });
        var isDone = false;

        collector.collect("Products", 24, undefined, {}, function (collections) {
          var products = collections.Products;
          var data = products[0];
          var expectedTitles = ["Fresh Tomatoes", "Shopkins - Peachy"];

          (0, _practicalmeteorChai.expect)(products.length).to.equal(2);
          (0, _practicalmeteorChai.expect)(expectedTitles.some(function (title) {
            return title === data.title;
          })).to.be.ok;

          if (isDone === false) {
            isDone = true;
            done();
          }
        });
      });

      it("should return only products matching query", function (done) {
        var productScrollLimit = 24;
        var filters = { query: "Shopkins" };
        sandbox.stub(_api.Reaction, "getCurrentShop", function () {
          return shop;
        });
        sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
          return false;
        });

        var collector = new _johanbrookPublicationCollector.PublicationCollector({ userId: Random.id() });

        collector.collect("Products", productScrollLimit, filters, {}, function (collections) {
          var products = collections.Products;
          var data = products[0];

          (0, _practicalmeteorChai.expect)(data.title).to.equal("Shopkins - Peachy");

          done();
        });
      });

      it("should not return products not matching query", function (done) {
        var productScrollLimit = 24;
        var filters = { query: "random search" };
        sandbox.stub(_api.Reaction, "getCurrentShop", function () {
          return shop;
        });
        sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
          return false;
        });

        var collector = new _johanbrookPublicationCollector.PublicationCollector({ userId: Random.id() });

        collector.collect("Products", productScrollLimit, filters, {}, function (collections) {
          var products = collections.Products;

          (0, _practicalmeteorChai.expect)(products.length).to.equal(0);

          done();
        });
      });

      it("should return products in price.min query", function (done) {
        var productScrollLimit = 24;
        var filters = { "price.min": "2.00" };
        sandbox.stub(_api.Reaction, "getCurrentShop", function () {
          return shop;
        });
        sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
          return false;
        });

        var collector = new _johanbrookPublicationCollector.PublicationCollector({ userId: Random.id() });

        collector.collect("Products", productScrollLimit, filters, {}, function (collections) {
          var products = collections.Products;

          (0, _practicalmeteorChai.expect)(products.length).to.equal(1);

          done();
        });
      });

      it("should return products in price.max query", function (done) {
        var productScrollLimit = 24;
        var filters = { "price.max": "24.00" };
        sandbox.stub(_api.Reaction, "getCurrentShop", function () {
          return shop;
        });
        sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
          return false;
        });

        var collector = new _johanbrookPublicationCollector.PublicationCollector({ userId: Random.id() });

        collector.collect("Products", productScrollLimit, filters, {}, function (collections) {
          var products = collections.Products;

          (0, _practicalmeteorChai.expect)(products.length).to.equal(2);

          done();
        });
      });

      it("should return products in price.min - price.max range query", function (done) {
        var productScrollLimit = 24;
        var filters = { "price.min": "12.00", "price.max": "19.98" };
        sandbox.stub(_api.Reaction, "getCurrentShop", function () {
          return shop;
        });
        sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
          return false;
        });

        var collector = new _johanbrookPublicationCollector.PublicationCollector({ userId: Random.id() });

        collector.collect("Products", productScrollLimit, filters, {}, function (collections) {
          var products = collections.Products;

          (0, _practicalmeteorChai.expect)(products.length).to.equal(2);

          done();
        });
      });

      it("should return products where value is in price set query", function (done) {
        var productScrollLimit = 24;
        var filters = { "price.min": "13.00", "price.max": "24.00" };
        sandbox.stub(_api.Reaction, "getCurrentShop", function () {
          return shop;
        });
        sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
          return false;
        });

        var collector = new _johanbrookPublicationCollector.PublicationCollector({ userId: Random.id() });

        collector.collect("Products", productScrollLimit, filters, {}, function (collections) {
          var products = collections.Products;

          (0, _practicalmeteorChai.expect)(products.length).to.equal(1);

          done();
        });
      });

      it("should return products from all shops when multiple shops are provided", function (done) {
        var filters = { shops: [shop._id] };
        var productScrollLimit = 24;
        sandbox.stub(_api.Reaction, "getCurrentShop", function () {
          return { _id: "123" };
        });
        sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
          return true;
        });

        var collector = new _johanbrookPublicationCollector.PublicationCollector({ userId: Random.id() });
        var isDone = false;

        collector.collect("Products", productScrollLimit, filters, {}, function (collections) {
          var products = collections.Products;
          (0, _practicalmeteorChai.expect)(products.length).to.equal(3);

          var data = products[1];
          (0, _practicalmeteorChai.expect)(["My Little Pony", "Shopkins - Peachy"].some(function (title) {
            return title === data.title;
          })).to.be.ok;

          if (!isDone) {
            isDone = true;
            done();
          }
        });
      });
    });

    describe("Product", function () {
      it("should return a product based on an id", function (done) {
        var product = Collections.Products.findOne({
          isVisible: true
        });
        sandbox.stub(_api.Reaction, "getCurrentShop", function () {
          return shop;
        });

        var collector = new _johanbrookPublicationCollector.PublicationCollector({ userId: Random.id() });

        collector.collect("Product", product._id, function (collections) {
          var products = collections.Products;
          var data = products[0];

          (0, _practicalmeteorChai.expect)(data.title).to.equal(product.title);

          done();
        });
      });

      it("should return a product based on a regex", function (done) {
        sandbox.stub(_api.Reaction, "getCurrentShop", function () {
          return shop;
        });

        var collector = new _johanbrookPublicationCollector.PublicationCollector({ userId: Random.id() });

        collector.collect("Product", "shopkins", function (collections) {
          var products = collections.Products;
          var data = products[0];

          (0, _practicalmeteorChai.expect)(data.title).to.equal("Shopkins - Peachy");

          done();
        });
      });

      it("should not return a product based on a regex if it isn't visible", function (done) {
        sandbox.stub(_api.Reaction, "getCurrentShop", function () {
          return shop;
        });
        sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
          return false;
        });

        var collector = new _johanbrookPublicationCollector.PublicationCollector({ userId: Random.id() });
        var isDone = false;

        collector.collect("Product", "my", function (collections) {
          var products = collections.Products;

          (0, _practicalmeteorChai.expect)(products).to.be.undefined;

          if (!isDone) {
            isDone = true;
            done();
          }
        });
      });

      it("should return a product based on a regex to admin even if it isn't visible", function (done) {
        sandbox.stub(_api.Reaction, "getCurrentShop", function () {
          return shop;
        });
        sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
          return true;
        });

        var collector = new _johanbrookPublicationCollector.PublicationCollector({ userId: Random.id() });
        var isDone = false;

        collector.collect("Product", "my", function (collections) {
          var products = collections.Products;
          var data = products[0];

          (0, _practicalmeteorChai.expect)(data.title).to.equal("My Little Pony");

          if (!isDone) {
            isDone = true;
            done();
          }
        });
      });
    });
  });
});