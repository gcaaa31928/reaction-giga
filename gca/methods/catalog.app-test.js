"use strict";

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _meteor = require("meteor/meteor");

var _dburlesFactory = require("meteor/dburles:factory");

var _api = require("/server/api");

var _collections = require("/lib/collections");

var _practicalmeteorChai = require("meteor/practicalmeteor:chai");

var _practicalmeteorSinon = require("meteor/practicalmeteor:sinon");

var _alanningRoles = require("meteor/alanning:roles");

var _products = require("/server/imports/fixtures/products");

var _fixtures = require("/server/imports/fixtures");

var _fixtures2 = _interopRequireDefault(_fixtures);

var _revisions = require("/imports/plugins/core/revisions/lib/api/revisions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint dot-notation: 0 */
/* eslint no-loop-func: 0 */
(0, _fixtures2.default)();

describe("core product methods", function () {
  // we can't clean Products collection after each test from now, because we
  // have functions which called from async db operations callbacks. So, if we
  // clean collections each time - we could have a situation when next test
  // started, but previous not yet finished his async computations.
  // So, if you need to clean the collection for your test, you could try to do
  // it, but this is not recommended in droves
  var sandbox = void 0;
  var updateStub = void 0;
  var removeStub = void 0;
  var insertStub = void 0;

  before(function () {
    // We are mocking inventory hooks, because we don't need them here, but
    // if you want to do a real stress test, you could try to comment out
    // this three lines. This is needed only for ./reaction test. In one
    // package test this is ignoring.
    if (Array.isArray(_collections.Products._hookAspects.remove.after) && _collections.Products._hookAspects.remove.after.length) {
      updateStub = _practicalmeteorSinon.sinon.stub(_collections.Products._hookAspects.update.after[0], "aspect");
      removeStub = _practicalmeteorSinon.sinon.stub(_collections.Products._hookAspects.remove.after[0], "aspect");
      insertStub = _practicalmeteorSinon.sinon.stub(_collections.Products._hookAspects.insert.after[0], "aspect");
    }
    _collections.Products.direct.remove({});
  });

  after(function () {
    if (updateStub) {
      updateStub.restore();
      removeStub.restore();
      insertStub.restore();
    }
  });

  beforeEach(function () {
    sandbox = _practicalmeteorSinon.sinon.sandbox.create();
    sandbox.stub(_revisions.RevisionApi, "isRevisionControlEnabled", function () {
      return true;
    });
    _collections.Revisions.direct.remove({});
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("products/cloneVariant", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
        return false;
      });
      var insertProductSpy = sandbox.spy(_collections.Products, "insert");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/cloneVariant", "fakeId", "fakeVarId");
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(insertProductSpy).to.not.have.been.called;
    });

    it("should clone variant by admin", function (done) {
      sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var variants = _collections.Products.find({ ancestors: [product._id] }).fetch();
      (0, _practicalmeteorChai.expect)(variants.length).to.equal(1);
      _meteor.Meteor.call("products/cloneVariant", product._id, variants[0]._id);
      variants = _collections.Products.find({ ancestors: [product._id] }).count();
      (0, _practicalmeteorChai.expect)(variants).to.equal(2);
      return done();
    });

    it("number of `child variants` between source and cloned `variants` should be equal", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var variant = _collections.Products.find({ ancestors: [product._id] }).fetch();
      var optionCount = _collections.Products.find({ ancestors: {
          $in: [variant[0]._id]
        } }).count();
      (0, _practicalmeteorChai.expect)(optionCount).to.equal(2);

      _meteor.Meteor.call("products/cloneVariant", product._id, variant[0]._id);
      var variants = _collections.Products.find({ ancestors: [product._id] }).fetch();
      var clonedVariant = variants.filter(function (v) {
        return v._id !== variant[0]._id;
      });
      (0, _practicalmeteorChai.expect)(variant[0]._id).to.not.equal(clonedVariant[0]._id);
      (0, _practicalmeteorChai.expect)((0, _isEqual3.default)(variant[0].ancestors, clonedVariant[0].ancestors)).to.be.true;
      // expect(variant[0].ancestors).to.equal(clonedVariant[0].ancestors);

      optionCount = _collections.Products.find({ ancestors: { $in: [clonedVariant[0]._id] } }).count();
      (0, _practicalmeteorChai.expect)(optionCount).to.equal(2);
    });
  });

  describe("products/createVariant", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var updateProductSpy = sandbox.spy(_collections.Products, "update");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/createVariant", "fakeId");
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(updateProductSpy).to.not.have.been.called;
    });

    it("should create top level variant", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var variants = _collections.Products.find({ ancestors: [product._id] }).fetch();
      (0, _practicalmeteorChai.expect)(variants.length).to.equal(1);
      _meteor.Meteor.call("products/createVariant", product._id);
      _meteor.Meteor._sleepForMs(500);
      variants = _collections.Products.find({ ancestors: [product._id] }).fetch();
      (0, _practicalmeteorChai.expect)(variants.length).to.equal(2);
      return done();
    });

    it("should create option variant", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var options = void 0;
      var product = (0, _products.addProduct)();
      var variant = _collections.Products.find({ ancestors: [product._id] }).fetch()[0];
      options = _collections.Products.find({
        ancestors: { $in: [variant._id] }
      }).fetch();
      (0, _practicalmeteorChai.expect)(options.length).to.equal(2);

      _meteor.Meteor.call("products/createVariant", variant._id);
      _meteor.Meteor._sleepForMs(500);
      options = _collections.Products.find({
        ancestors: { $in: [variant._id] }
      }).fetch();
      (0, _practicalmeteorChai.expect)(options.length).to.equal(3);
      return done();
    });

    it("should create variant with predefined object", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var newVariant = {
        title: "newVariant"
      };
      var variants = _collections.Products.find({ ancestors: [product._id] }).fetch();
      var firstVariantId = variants[0]._id;
      (0, _practicalmeteorChai.expect)(variants.length).to.equal(1);

      _meteor.Meteor.call("products/createVariant", product._id, newVariant);
      _meteor.Meteor._sleepForMs(500);
      variants = _collections.Products.find({ ancestors: [product._id] }).fetch();
      var createdVariant = variants.filter(function (v) {
        return v._id !== firstVariantId;
      });
      (0, _practicalmeteorChai.expect)(variants.length).to.equal(2);
      (0, _practicalmeteorChai.expect)(createdVariant[0].title).to.equal("newVariant");
      return done();
    });
  });

  describe("products/updateVariant", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var updateProductSpy = sandbox.stub(_collections.Products, "update");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/updateVariant", { _id: "fakeId" });
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(updateProductSpy).to.not.have.been.called;
    });

    it("should not update individual variant by admin passing in full object", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var variant = _collections.Products.find({ ancestors: [product._id] }).fetch()[0];
      variant["title"] = "Updated Title";
      variant["price"] = 7;
      _meteor.Meteor.call("products/updateVariant", variant);
      variant = _collections.Products.find({ ancestors: [product._id] }).fetch()[0];
      (0, _practicalmeteorChai.expect)(variant.price).to.not.equal(7);
      (0, _practicalmeteorChai.expect)(variant.title).to.not.equal("Updated Title");

      return done();
    });

    it("should update individual variant revision by admin passing in full object", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var variant = _collections.Products.find({ ancestors: [product._id] }).fetch()[0];
      variant["title"] = "Updated Title";
      variant["price"] = 7;
      _meteor.Meteor.call("products/updateVariant", variant);
      var variantRevision = _collections.Revisions.find({ documentId: variant._id }).fetch()[0];
      (0, _practicalmeteorChai.expect)(variantRevision.documentData.price).to.equal(7);
      (0, _practicalmeteorChai.expect)(variantRevision.documentData.title).to.equal("Updated Title");

      return done();
    });

    it("should not update individual variant by admin passing in partial object", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var variant = _collections.Products.find({ ancestors: [product._id] }).fetch()[0];
      _meteor.Meteor.call("products/updateVariant", {
        _id: variant._id,
        title: "Updated Title",
        price: 7
      });
      var updatedVariant = _collections.Products.findOne(variant._id);
      (0, _practicalmeteorChai.expect)(updatedVariant.price).to.not.equal(7);
      (0, _practicalmeteorChai.expect)(updatedVariant.title).to.not.equal("Updated Title");
      (0, _practicalmeteorChai.expect)(updatedVariant.optionTitle).to.equal(variant.optionTitle);
    });

    it("should update individual variant revision by admin passing in partial object", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var variant = _collections.Products.find({ ancestors: [product._id] }).fetch()[0];
      _meteor.Meteor.call("products/updateVariant", {
        _id: variant._id,
        title: "Updated Title",
        price: 7
      });
      var updatedVariantRevision = _collections.Revisions.findOne({ documentId: variant._id });
      (0, _practicalmeteorChai.expect)(updatedVariantRevision.documentData.price).to.equal(7);
      (0, _practicalmeteorChai.expect)(updatedVariantRevision.documentData.title).to.equal("Updated Title");
      (0, _practicalmeteorChai.expect)(updatedVariantRevision.documentData.optionTitle).to.equal(variant.optionTitle);
    });
  });

  describe("products/deleteVariant", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var removeProductSpy = sandbox.spy(_collections.Products, "remove");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/deleteVariant", "fakeId");
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(removeProductSpy).to.not.have.been.called;
    });

    it("should not mark top-level variant as deleted", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var variant = _collections.Products.findOne({ ancestors: [product._id] });
      (0, _practicalmeteorChai.expect)(variant.isDeleted).to.equal(false);
      _meteor.Meteor.call("products/deleteVariant", variant._id);
      variant = _collections.Products.findOne(variant._id);
      (0, _practicalmeteorChai.expect)(variant.isDeleted).to.not.equal(true);
    });

    it("should mark top-level variant revision as deleted", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var variant = _collections.Products.findOne({ ancestors: [product._id] });
      (0, _practicalmeteorChai.expect)(variant.isDeleted).to.equal(false);
      _meteor.Meteor.call("products/deleteVariant", variant._id);
      var variantRevision = _collections.Revisions.findOne({ documentId: variant._id });
      (0, _practicalmeteorChai.expect)(variantRevision.documentData.isDeleted).to.equal(true);
    });

    it("should publish top-level variant as deleted", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var variant = _collections.Products.findOne({ ancestors: [product._id] });
      (0, _practicalmeteorChai.expect)(variant.isDeleted).to.equal(false);
      _meteor.Meteor.call("products/deleteVariant", variant._id);
      _meteor.Meteor.call("revisions/publish", variant._id);
      var publishedProduct = _collections.Products.findOne(variant._id);
      (0, _practicalmeteorChai.expect)(publishedProduct.isDeleted).to.equal(true);
    });

    it("should mark all child variants (options) as deleted if top-level variant deleted", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var variant = _collections.Products.find({ ancestors: [product._id] }).fetch()[0];
      var variants = _collections.Products.find({ ancestors: {
          $in: [variant._id]
        } }).fetch();
      (0, _practicalmeteorChai.expect)(variants.length).to.equal(2);
      _meteor.Meteor.call("products/deleteVariant", variant._id);
    });
  });

  describe("products/cloneProduct", function () {
    // At the moment we do not have any mechanisms that track the product
    // cloning hierarchy, so the only way to track that will be cleaning
    // collection on before each test.
    beforeEach(function () {
      return _collections.Products.direct.remove({});
    });

    it("should throw 403 error by non admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "inventory/remove", function () {
        check(arguments, [Match.Any]);
      });
      var insertProductSpy = sandbox.spy(_collections.Products, "insert");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/cloneProduct", {});
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(insertProductSpy).to.not.have.been.called;
    });

    it("should clone product", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "inventory/register", function () {
        check(arguments, [Match.Any]);
      });
      var product = (0, _products.addProduct)();
      (0, _practicalmeteorChai.expect)(_collections.Products.find({ type: "simple" }).count()).to.equal(1);
      _meteor.Meteor.call("products/cloneProduct", product);
      (0, _practicalmeteorChai.expect)(_collections.Products.find({ type: "simple" }).count()).to.equal(2);
      var productCloned = _collections.Products.find({
        _id: {
          $ne: product._id
        },
        type: "simple"
      }).fetch()[0];
      (0, _practicalmeteorChai.expect)(productCloned.title).to.equal(product.title + "-copy");
      (0, _practicalmeteorChai.expect)(productCloned.handle).to.equal(product.handle + "-copy");
      (0, _practicalmeteorChai.expect)(productCloned.pageTitle).to.equal(product.pageTitle);
      (0, _practicalmeteorChai.expect)(productCloned.description).to.equal(product.description);

      return done();
    });

    it("product should be cloned with all variants and child variants with equal data, but not the same `_id`s", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "inventory/register", function () {
        check(arguments, [Match.Any]);
      });
      var product = (0, _products.addProduct)();
      var variants = _collections.Products.find({ ancestors: { $in: [product._id] } }).fetch();
      (0, _practicalmeteorChai.expect)(variants.length).to.equal(3);
      _meteor.Meteor.call("products/cloneProduct", product);
      var clone = _collections.Products.find({
        _id: {
          $ne: product._id
        },
        type: "simple"
      }).fetch()[0];
      var cloneVariants = _collections.Products.find({
        ancestors: { $in: [clone._id] }
      }).fetch();
      (0, _practicalmeteorChai.expect)(cloneVariants.length).to.equal(3);

      var _loop = function _loop(i) {
        (0, _practicalmeteorChai.expect)(cloneVariants.some(function (clonedVariant) {
          return clonedVariant.title === variants[i].title;
        })).to.be.ok;
      };

      for (var i = 0; i < variants.length; i++) {
        _loop(i);
      }

      return done();
    });

    it("product group cloning should create the same number of new products", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "inventory/register", function () {
        check(arguments, [Match.Any]);
      });
      var product = (0, _products.addProduct)();
      var product2 = (0, _products.addProduct)();
      _meteor.Meteor.call("products/cloneProduct", [product, product2]);
      var clones = _collections.Products.find({
        _id: {
          $nin: [product._id, product2._id]
        },
        type: "simple"
      }).fetch();
      (0, _practicalmeteorChai.expect)(clones.length).to.equal(2);

      return done();
    });

    it("product group cloning should create the same number of cloned variants", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "inventory/register", function () {
        check(arguments, [Match.Any]);
      });
      var product = (0, _products.addProduct)();
      var product2 = (0, _products.addProduct)();
      var variants = _collections.Products.find({
        ancestors: { $in: [product._id, product2._id] }
      }).count();
      _meteor.Meteor.call("products/cloneProduct", [product, product2]);
      var clones = _collections.Products.find({
        _id: {
          $nin: [product._id, product2._id]
        },
        type: "simple"
      }).fetch();
      (0, _practicalmeteorChai.expect)(clones.length).to.equal(2);
      var clonedVariants = _collections.Products.find({
        ancestors: { $in: [clones[0]._id, clones[1]._id] }
      }).count();
      (0, _practicalmeteorChai.expect)(clonedVariants).to.equal(variants);

      return done();
    });
  });

  describe("createProduct", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var insertProductSpy = sandbox.spy(_collections.Products, "insert");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/createProduct");
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(insertProductSpy).to.not.have.been.called;
    });

    it("should create new product", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var insertProductSpy = sandbox.stub(_collections.Products, "insert", function () {
        return 1;
      });
      (0, _practicalmeteorChai.expect)(_meteor.Meteor.call("products/createProduct")).to.equal(1);
      (0, _practicalmeteorChai.expect)(insertProductSpy).to.have.been.called;
    });

    it("should create variant with new product", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      _meteor.Meteor.call("products/createProduct", function (error, result) {
        if (result) {
          // this test successfully finds product variant only by such way
          _meteor.Meteor.setTimeout(function () {
            (0, _practicalmeteorChai.expect)(_collections.Products.find({ ancestors: [result] }).count()).to.equal(1);
            return done();
          }, 50);
        }
      });
    });
  });

  describe("deleteProduct", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var removeProductSpy = sandbox.spy(_collections.Products, "remove");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/archiveProduct", "fakeId");
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(removeProductSpy).to.not.have.been.called;
    });

    it("should not mark product as deleted by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      _meteor.Meteor.call("products/archiveProduct", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.isDeleted).to.equal(false);
    });

    it("should mark product revision as deleted by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      _meteor.Meteor.call("products/archiveProduct", product._id);
      var productRevision = _collections.Revisions.findOne({ documentId: product._id });
      (0, _practicalmeteorChai.expect)(productRevision.documentData.isDeleted).to.equal(true);
    });

    it("should publish product revision marked as deleted by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      _meteor.Meteor.call("products/archiveProduct", product._id);
      _meteor.Meteor.call("revisions/publish", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.isDeleted).to.equal(true);
    });

    it("should throw error if removal fails", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      sandbox.stub(_collections.Products, "remove");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/archiveProduct", product._id);
      }).to.throw(_meteor.Meteor.Error, /Something went wrong, nothing was deleted/);
      (0, _practicalmeteorChai.expect)(_collections.Products.find(product._id).count()).to.equal(1);
    });
  });

  describe("updateProductField", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var updateProductSpy = sandbox.spy(_collections.Products, "update");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/updateProductField", "fakeId", "title", "Updated Title");
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(updateProductSpy).to.not.have.been.called;
    });

    it("should not update product field by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      _meteor.Meteor.call("products/updateProductField", product._id, "title", "Updated Title");
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.title).to.not.equal("Updated Title");
    });

    it("should update product revision field by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      _meteor.Meteor.call("products/updateProductField", product._id, "title", "Updated Title");
      var productRevision = _collections.Revisions.findOne({ documentId: product._id });
      (0, _practicalmeteorChai.expect)(productRevision.documentData.title).to.equal("Updated Title");
    });

    it("should publish changes to product field by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      _meteor.Meteor.call("products/updateProductField", product._id, "title", "Updated Title");
      _meteor.Meteor.call("revisions/publish", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.title).to.equal("Updated Title");
    });

    it("should not update variant fields", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var variant = _collections.Products.findOne({ ancestors: [product._id] });
      _meteor.Meteor.call("products/updateProductField", variant._id, "title", "Updated Title");
      variant = _collections.Products.findOne(variant._id);
      (0, _practicalmeteorChai.expect)(variant.title).to.not.equal("Updated Title");
    });

    it("should update variant revision fields", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var variant = _collections.Products.findOne({ ancestors: [product._id] });
      _meteor.Meteor.call("products/updateProductField", variant._id, "title", "Updated Title");
      var variantRevision = _collections.Revisions.findOne({ documentId: variant._id });
      (0, _practicalmeteorChai.expect)(variantRevision.documentData.title).to.equal("Updated Title");
    });

    it("should publish update for variant fields", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var variant = _collections.Products.findOne({ ancestors: [product._id] });
      _meteor.Meteor.call("products/updateProductField", variant._id, "title", "Updated Title");
      _meteor.Meteor.call("revisions/publish", product._id);
      variant = _collections.Products.findOne(variant._id);
      (0, _practicalmeteorChai.expect)(variant.title).to.equal("Updated Title");
    });
  });

  describe("updateProductTags", function () {
    beforeEach(function () {
      return _collections.Tags.remove({});
    });

    it("should throw 403 error by non admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var updateProductSpy = sandbox.spy(_collections.Products, "update");
      var insertTagsSpy = sandbox.spy(_collections.Tags, "insert");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/updateProductTags", "fakeId", "productTag", null);
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(updateProductSpy).to.not.have.been.called;
      (0, _practicalmeteorChai.expect)(insertTagsSpy).to.not.have.been.called;
    });

    it("should not new tag when passed tag name and null ID by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var tagName = "Product Tag";
      (0, _practicalmeteorChai.expect)(_collections.Tags.findOne({ name: tagName })).to.be.undefined;
      _meteor.Meteor.call("products/updateProductTags", product._id, tagName, null);
      var tag = _collections.Tags.findOne({ name: tagName });
      (0, _practicalmeteorChai.expect)(tag.slug).to.equal(_api.Reaction.getSlug(tagName));
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.hashtags).to.not.contain(tag._id);
    });

    it("should add new tag to product revision when passed tag name and null ID by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var tagName = "Product Tag";
      (0, _practicalmeteorChai.expect)(_collections.Tags.findOne({ name: tagName })).to.be.undefined;
      _meteor.Meteor.call("products/updateProductTags", product._id, tagName, null);
      var tag = _collections.Tags.findOne({ name: tagName });
      (0, _practicalmeteorChai.expect)(tag.slug).to.equal(_api.Reaction.getSlug(tagName));
      var productRevision = _collections.Revisions.findOne({ documentId: product._id });
      (0, _practicalmeteorChai.expect)(productRevision.documentData.hashtags).to.contain(tag._id);
    });

    it("should publish new product tag when passed tag name and null ID by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var tagName = "Product Tag";
      (0, _practicalmeteorChai.expect)(_collections.Tags.findOne({ name: tagName })).to.be.undefined;
      _meteor.Meteor.call("products/updateProductTags", product._id, tagName, null);
      var tag = _collections.Tags.findOne({ name: tagName });
      (0, _practicalmeteorChai.expect)(tag.slug).to.equal(_api.Reaction.getSlug(tagName));
      _meteor.Meteor.call("revisions/publish", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.hashtags).to.contain(tag._id);
    });

    it("should not add existing tag when passed existing tag and tag._id by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var tag = _dburlesFactory.Factory.create("tag");
      (0, _practicalmeteorChai.expect)(_collections.Tags.find().count()).to.equal(1);
      (0, _practicalmeteorChai.expect)(product.hashtags).to.not.contain(tag._id);
      _meteor.Meteor.call("products/updateProductTags", product._id, tag.name, tag._id);
      (0, _practicalmeteorChai.expect)(_collections.Tags.find().count()).to.equal(1);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.hashtags).to.not.contain(tag._id);
    });

    it("should add existing tag to product revision when passed existing tag and tag._id by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var tag = _dburlesFactory.Factory.create("tag");
      (0, _practicalmeteorChai.expect)(_collections.Tags.find().count()).to.equal(1);
      (0, _practicalmeteorChai.expect)(product.hashtags).to.not.contain(tag._id);
      _meteor.Meteor.call("products/updateProductTags", product._id, tag.name, tag._id);
      (0, _practicalmeteorChai.expect)(_collections.Tags.find().count()).to.equal(1);
      var productRevision = _collections.Revisions.findOne({ documentId: product._id });
      (0, _practicalmeteorChai.expect)(productRevision.documentData.hashtags).to.contain(tag._id);
    });

    it("should publish existing tag for product when passed existing tag and tag._id by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var tag = _dburlesFactory.Factory.create("tag");
      (0, _practicalmeteorChai.expect)(_collections.Tags.find().count()).to.equal(1);
      (0, _practicalmeteorChai.expect)(product.hashtags).to.not.contain(tag._id);
      _meteor.Meteor.call("products/updateProductTags", product._id, tag.name, tag._id);
      (0, _practicalmeteorChai.expect)(_collections.Tags.find().count()).to.equal(1);
      _meteor.Meteor.call("revisions/publish", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.hashtags).to.contain(tag._id);
    });
  });

  describe("removeProductTag", function () {
    beforeEach(function () {
      return _collections.Tags.remove({});
    });

    it("should throw 403 error by non admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var updateProductSpy = sandbox.spy(_collections.Products, "update");
      var removeTagsSpy = sandbox.spy(_collections.Tags, "remove");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/removeProductTag", "fakeId", "tagId");
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(updateProductSpy).to.not.have.been.called;
      (0, _practicalmeteorChai.expect)(removeTagsSpy).to.not.have.been.called;
    });

    it("should not remove product tag by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var tag = _dburlesFactory.Factory.create("tag");

      // Update product tags and publish so the original prodcut will have the tags
      _meteor.Meteor.call("products/updateProductTags", product._id, tag.name, tag._id);
      _meteor.Meteor.call("revisions/publish", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.hashtags).to.contain(tag._id);
      (0, _practicalmeteorChai.expect)(_collections.Tags.find().count()).to.equal(1);

      // Remove the tag from the published prouct and ensure it didn't succeed.
      // Revision control should stop the published product from being changed.
      _meteor.Meteor.call("products/removeProductTag", product._id, tag._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.hashtags).to.contain(tag._id);
      (0, _practicalmeteorChai.expect)(_collections.Tags.find().count()).to.equal(1);
    });

    it("should remove tag in product revision by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var tag = _dburlesFactory.Factory.create("tag");

      // Update product tags and publish so the original prodcut will have the tags
      _meteor.Meteor.call("products/updateProductTags", product._id, tag.name, tag._id);
      _meteor.Meteor.call("revisions/publish", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.hashtags).to.contain(tag._id);
      (0, _practicalmeteorChai.expect)(_collections.Tags.find().count()).to.equal(1);

      // Remove the tag from the published prouct and ensure it changed in the revision.
      _meteor.Meteor.call("products/removeProductTag", product._id, tag._id);
      var productRevision = _collections.Revisions.findOne({
        "documentId": product._id,
        "workflow.status": { $nin: ["revision/published"] }
      });
      (0, _practicalmeteorChai.expect)(productRevision.documentData.hashtags).to.not.contain(tag._id);
      (0, _practicalmeteorChai.expect)(_collections.Tags.find().count()).to.equal(1);
    });

    it.skip("should publish remove product tag by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();

      // Update product tags and publish so the original prodcut will have the tags
      var tag = _dburlesFactory.Factory.create("tag");
      _meteor.Meteor.call("products/updateProductTags", product._id, tag.name, tag._id);
      _meteor.Meteor.call("revisions/publish", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.hashtags).to.contain(tag._id);
      (0, _practicalmeteorChai.expect)(_collections.Tags.find().count()).to.equal(1);

      // Remove the tag from the published prouct which should create a revision.
      // Then publish that revision and ensure that it published product changed.
      _meteor.Meteor.call("products/removeProductTag", product._id, tag._id);
      _meteor.Meteor.call("revisions/publish", product._id);
      product = _collections.Products.findOne(product._id);
      var tags = _collections.Tags.find();
      (0, _practicalmeteorChai.expect)(product.hashtags).to.not.contain(tag._id);
      (0, _practicalmeteorChai.expect)(tags.count()).to.equal(1);
      (0, _practicalmeteorChai.expect)(tags.fetch()[0].isDeleted).to.equal(true);
    });
  });

  describe("setHandle", function () {
    beforeEach(function () {
      return _collections.Tags.remove({});
    });

    it("should throw 403 error by non admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var productUpdateSpy = sandbox.spy(_collections.Products, "update");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/setHandle", "fakeId");
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(productUpdateSpy).to.not.have.been.called;
    });

    it("should not set handle for product by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var productHandle = product.handle;
      _meteor.Meteor.call("products/updateProductField", product._id, "title", "new product name");
      _meteor.Meteor.call("products/setHandle", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.handle).to.equal(productHandle);
    });

    it("should set handle correctly on product revision", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      _meteor.Meteor.call("products/updateProductField", product._id, "title", "new second product name");
      _meteor.Meteor.call("products/setHandle", product._id);
      var revision = _collections.Revisions.findOne({ documentId: product._id });
      (0, _practicalmeteorChai.expect)(revision.documentData.handle).to.not.equal("new-second-product-name");
    });

    it("should not set handle on published product", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      _meteor.Meteor.call("products/updateProductField", product._id, "title", "new second product name");
      _meteor.Meteor.call("products/setHandle", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.handle).to.not.equal("new-second-product-name");
    });

    it("should publish handle correctly", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      _meteor.Meteor.call("products/updateProductField", product._id, "title", "new second product name");
      _meteor.Meteor.call("products/setHandle", product._id);
      _meteor.Meteor.call("revisions/publish", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.handle).to.not.equal("new-second-product-name");
    });

    it("unpublished products with the same title should not receive correct handle", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      _meteor.Meteor.call("products/updateProductField", product._id, "title", "new second product name");
      _meteor.Meteor.call("products/setHandle", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.handle).to.not.equal("new-second-product-name-copy");
    });

    it("products with the same title should receive correct handle on revision", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      _meteor.Meteor.call("products/updateProductField", product._id, "title", "new second product name");
      _meteor.Meteor.call("products/setHandle", product._id);
      var productRevision = _collections.Revisions.findOne({ documentId: product._id });
      (0, _practicalmeteorChai.expect)(productRevision.documentData.handle).to.not.equal("new-second-product-name-copy");
    });

    it("products with the same title should receive correct handle when published", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      _meteor.Meteor.call("products/updateProductField", product._id, "title", "new second product name");
      _meteor.Meteor.call("products/setHandle", product._id);
      _meteor.Meteor.call("revisions/publish", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.handle).to.not.equal("new-second-product-name-copy");
    });
  });

  describe("setHandleTag", function () {
    beforeEach(function () {
      return _collections.Tags.remove({});
    });

    it("should throw 403 error by non admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var updateProductSpy = sandbox.spy(_collections.Products, "update");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/setHandleTag", "fakeId", "tagId");
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(updateProductSpy).to.not.have.been.called;
    });

    it("should not set handle tag for product by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var tag = _dburlesFactory.Factory.create("tag");
      _meteor.Meteor.call("products/setHandleTag", product._id, tag._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.handle).to.not.equal(tag.slug);
    });

    it("should set handle tag for product revision by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var tag = _dburlesFactory.Factory.create("tag");
      _meteor.Meteor.call("products/setHandleTag", product._id, tag._id);
      var productRevision = _collections.Revisions.findOne({ documentId: product._id });
      (0, _practicalmeteorChai.expect)(productRevision.documentData.handle).to.equal(tag.slug);
    });

    it("should publish set handle tag for product by admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var tag = _dburlesFactory.Factory.create("tag");
      _meteor.Meteor.call("products/setHandleTag", product._id, tag._id);
      _meteor.Meteor.call("revisions/publish", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.handle).to.equal(tag.slug);
    });
  });

  describe("updateProductPosition", function () {
    beforeEach(function () {
      return _collections.Tags.remove({});
    });

    it("should throw 403 error by non admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var updateProductSpy = sandbox.spy(_collections.Products, "update");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/updateProductPosition", "fakeId", {}, "tag");
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(updateProductSpy).to.not.have.been.called;
    });

    it("should not update product position by admin", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var tag = _dburlesFactory.Factory.create("tag");
      var position = {
        position: 0,
        weight: 0,
        updatedAt: new Date()
      };
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/updateProductPosition", product._id, position, tag.slug);
      }).to.not.throw(_meteor.Meteor.Error, /Access Denied/);
      var updatedProduct = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(updatedProduct.positions).to.be.undefined;

      return done();
    });

    it("should update product revision position by admin", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var tag = _dburlesFactory.Factory.create("tag");
      var position = {
        position: 0,
        weight: 0,
        updatedAt: new Date()
      };
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/updateProductPosition", product._id, position, tag.slug);
      }).to.not.throw(_meteor.Meteor.Error, /Access Denied/);
      var updatedProductRevision = _collections.Revisions.findOne({ documentId: product._id });
      (0, _practicalmeteorChai.expect)(updatedProductRevision.documentData.positions[tag.slug].position).to.equal(0);

      return done();
    });

    it("should publish product position by admin", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var tag = _dburlesFactory.Factory.create("tag");
      var position = {
        position: 0,
        weight: 0,
        updatedAt: new Date()
      };
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/updateProductPosition", product._id, position, tag.slug);
      }).to.not.throw(_meteor.Meteor.Error, /Access Denied/);
      _meteor.Meteor.call("revisions/publish", product._id);
      var updatedProduct = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(updatedProduct.positions[tag.slug].position).to.equal(0);

      return done();
    });
  });

  describe("updateMetaFields position", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var updateProductSpy = sandbox.spy(_collections.Products, "update");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/updateVariantsPosition", ["fakeId"]);
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(updateProductSpy).to.not.have.been.called;
    });

    it("should not update variants' position", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product1 = (0, _products.addProduct)();
      var product2 = (0, _products.addProduct)();
      var product3 = (0, _products.addProduct)();

      (0, _practicalmeteorChai.expect)(product1.index).to.be.undefined;
      (0, _practicalmeteorChai.expect)(product2.index).to.be.undefined;
      (0, _practicalmeteorChai.expect)(product3.index).to.be.undefined;

      _meteor.Meteor.call("products/updateVariantsPosition", [product2._id, product3._id, product1._id]);
      _meteor.Meteor._sleepForMs(500);
      var modifiedProduct1 = _collections.Products.findOne(product1._id);
      var modifiedProduct2 = _collections.Products.findOne(product2._id);
      var modifiedProduct3 = _collections.Products.findOne(product3._id);
      (0, _practicalmeteorChai.expect)(modifiedProduct1.index).to.be.undefined;
      (0, _practicalmeteorChai.expect)(modifiedProduct2.index).to.be.undefined;
      (0, _practicalmeteorChai.expect)(modifiedProduct3.index).to.be.undefined;
    });

    it("should update variants' revision position", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product1 = (0, _products.addProduct)();
      var product2 = (0, _products.addProduct)();
      var product3 = (0, _products.addProduct)();

      (0, _practicalmeteorChai.expect)(product1.index).to.be.undefined;
      (0, _practicalmeteorChai.expect)(product2.index).to.be.undefined;
      (0, _practicalmeteorChai.expect)(product3.index).to.be.undefined;

      _meteor.Meteor.call("products/updateVariantsPosition", [product2._id, product3._id, product1._id]);
      _meteor.Meteor._sleepForMs(500);
      var modifiedProductRevision1 = _collections.Revisions.findOne({ documentId: product1._id });
      var modifiedProductRevision2 = _collections.Revisions.findOne({ documentId: product2._id });
      var modifiedProductRevision3 = _collections.Revisions.findOne({ documentId: product3._id });
      (0, _practicalmeteorChai.expect)(modifiedProductRevision1.documentData.index).to.equal(2);
      (0, _practicalmeteorChai.expect)(modifiedProductRevision2.documentData.index).to.equal(0);
      (0, _practicalmeteorChai.expect)(modifiedProductRevision3.documentData.index).to.equal(1);
    });

    it.skip("should publish variants' revision position", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product1 = (0, _products.addProduct)();
      var product2 = (0, _products.addProduct)();
      var product3 = (0, _products.addProduct)();

      (0, _practicalmeteorChai.expect)(product1.index).to.be.undefined;
      (0, _practicalmeteorChai.expect)(product2.index).to.be.undefined;
      (0, _practicalmeteorChai.expect)(product3.index).to.be.undefined;

      _meteor.Meteor.call("products/updateVariantsPosition", [product2._id, product3._id, product1._id]);
      _meteor.Meteor._sleepForMs(500);
      _meteor.Meteor.publish("revisions/publish", [product1._id, product2._id, product3._id]);
      var modifiedProduct1 = _collections.Products.findOne(product1._id);
      var modifiedProduct2 = _collections.Products.findOne(product2._id);
      var modifiedProduct3 = _collections.Products.findOne(product3._id);
      (0, _practicalmeteorChai.expect)(modifiedProduct1.index).to.equal(2);
      (0, _practicalmeteorChai.expect)(modifiedProduct2.index).to.equal(0);
      (0, _practicalmeteorChai.expect)(modifiedProduct3.index).to.equal(1);
    });
  });

  describe("updateMetaFields", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var updateProductSpy = sandbox.spy(_collections.Products, "update");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/updateMetaFields", "fakeId", {
          key: "Material",
          value: "Spandex"
        });
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(updateProductSpy).to.not.have.been.called;
    });

    it("should not add meta fields by admin", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      _meteor.Meteor.call("products/updateMetaFields", product._id, {
        key: "Material",
        value: "Spandex"
      });
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.metafields.length).to.be.equal(0);

      return done();
    });

    it("should add meta fields to product revision by admin", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      _meteor.Meteor.call("products/updateMetaFields", product._id, {
        key: "Material",
        value: "Spandex"
      });
      var productRevision = _collections.Revisions.findOne({ documentId: product._id });
      (0, _practicalmeteorChai.expect)(productRevision.documentData.metafields[0].key).to.equal("Material");
      (0, _practicalmeteorChai.expect)(productRevision.documentData.metafields[0].value).to.equal("Spandex");

      return done();
    });

    it("should publish add meta fields by admin", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      _meteor.Meteor.call("products/updateMetaFields", product._id, {
        key: "Material",
        value: "Spandex"
      });
      _meteor.Meteor.call("revisions/publish", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.metafields[0].key).to.equal("Material");
      (0, _practicalmeteorChai.expect)(product.metafields[0].value).to.equal("Spandex");

      return done();
    });
  });

  describe("publishProduct", function () {
    it("should throw 403 error by non admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var updateProductSpy = sandbox.spy(_collections.Products, "update");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/publishProduct", "fakeId");
      }).to.throw(_meteor.Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(updateProductSpy).to.not.have.been.called;
    });

    it.skip("should let admin publish product chnages", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/publishProduct", product._id);
      }).to.not.throw(_meteor.Meteor.Error, /Access Denied/);
      _meteor.Meteor.call("revisions/publish", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.isVisible).to.equal(true);
    });

    it("should not let admin toggle product visibility", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var isVisible = product.isVisible;
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/publishProduct", product._id);
      }).to.not.throw(_meteor.Meteor.Error, /Access Denied/);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.isVisible).to.equal(isVisible);
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/publishProduct", product._id);
      }).to.not.throw(_meteor.Meteor.Error, /Bad Request/);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.isVisible).to.equal(isVisible);
    });

    it.skip("should let admin toggle product revision visibility", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var productRevision = _collections.Revisions.findOne({ documentId: product._id });
      var isVisible = productRevision.documentData.isVisible;
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/publishProduct", product._id);
      }).to.not.throw(_meteor.Meteor.Error, /Access Denied/);
      productRevision = _collections.Revisions.findOne({ documentId: product._id });
      (0, _practicalmeteorChai.expect)(productRevision.documentData.isVisible).to.equal(!isVisible);
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/publishProduct", product._id);
      }).to.not.throw(_meteor.Meteor.Error, /Bad Request/);
      productRevision = _collections.Revisions.findOne({ documentId: product._id });
      (0, _practicalmeteorChai.expect)(productRevision.documentData.isVisible).to.equal(isVisible);
    });

    it("should publish admin toggle product visibility", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var isVisible = product.isVisible; // false

      // Toggle visible
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/publishProduct", product._id);
      }).to.not.throw(_meteor.Meteor.Error, /Access Denied/);
      _meteor.Meteor.call("revisions/publish", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.isVisible).to.equal(!isVisible);

      // Toggle not visible
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/publishProduct", product._id);
      }).to.not.throw(_meteor.Meteor.Error, /Bad Request/);
      _meteor.Meteor.call("revisions/publish", product._id);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.isVisible).to.equal(isVisible);
    });

    it("should not publish product when missing title", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var isVisible = product.isVisible;
      _collections.Products.update(product._id, {
        $set: {
          title: ""
        }
      }, {
        selector: { type: "simple" },
        validate: false
      });
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("products/publishProduct", product._id);
      }).to.not.throw(_meteor.Meteor.Error, /Access Denied/);
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.isVisible).to.equal(isVisible);
    });

    it("should not publish product when missing even one of child variant price", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var product = (0, _products.addProduct)();
      var isVisible = product.isVisible;
      var variant = _collections.Products.findOne({ ancestors: [product._id] });
      (0, _practicalmeteorChai.expect)(variant.ancestors[0]).to.equal(product._id);
      var options = _collections.Products.find({
        ancestors: [product._id, variant._id]
      }).fetch();
      (0, _practicalmeteorChai.expect)(options.length).to.equal(2);
      _collections.Products.update(options[0]._id, {
        $set: {
          isVisible: true,
          price: 0
        }
      }, {
        selector: { type: "variant" },
        validate: false
      });
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.isVisible).to.equal(isVisible);
    });

    it.skip("should not publish product when top variant has no children and no price", function (done) {
      return done();
    });

    it("should not publish product when missing variant", function () {
      var product = (0, _products.addProduct)();
      var isVisible = product.isVisible;
      sandbox.stub(_alanningRoles.Roles, "userIsInRole", function () {
        return true;
      });
      _collections.Products.remove({ ancestors: { $in: [product._id] } });
      product = _collections.Products.findOne(product._id);
      (0, _practicalmeteorChai.expect)(product.isVisible).to.equal(isVisible);
    });
  });
});