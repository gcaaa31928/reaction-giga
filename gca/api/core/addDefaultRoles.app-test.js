"use strict";

var _practicalmeteorSinon = require("meteor/practicalmeteor:sinon");

var _practicalmeteorChai = require("meteor/practicalmeteor:chai");

var _collections = require("/lib/collections");

var _api = require("/server/api");

describe("Server/API/Core", function () {
  var sandbox = void 0;

  beforeEach(function () {
    sandbox = _practicalmeteorSinon.sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("addDefaultRoles", function () {
    beforeEach(function () {
      return _collections.Shops.remove({});
    });

    it("should add a role to defaultRoles in a specified shop", function () {
      var shop = Factory.create("shop");
      _api.Reaction.addRolesToDefaultRoleSet({ shops: [shop._id], roles: ["test-role"], roleSets: ["defaultRoles"] });
      shop = _collections.Shops.findOne();
      (0, _practicalmeteorChai.expect)(shop.defaultRoles).to.contain("test-role");
    });

    it("should add a role to defaultRoles for an array of shops", function () {
      var shop = Factory.create("shop");
      var shop2 = Factory.create("shop");
      _api.Reaction.addRolesToDefaultRoleSet({ shops: [shop._id, shop2._id], roles: ["test-role2"], roleSets: ["defaultRoles"] });
      shop = _collections.Shops.findOne({ _id: shop._id });
      shop2 = _collections.Shops.findOne({ _id: shop2._id });
      (0, _practicalmeteorChai.expect)(shop.defaultRoles).to.contain("test-role2");
      (0, _practicalmeteorChai.expect)(shop2.defaultRoles).to.contain("test-role2");
    });

    it("should add a role to defaultRoles for all shops", function () {
      var shop = Factory.create("shop");
      var shop2 = Factory.create("shop");
      _api.Reaction.addRolesToDefaultRoleSet({ allShops: true, roles: ["test-all-shops"], roleSets: ["defaultRoles"] });
      shop = _collections.Shops.findOne({ _id: shop._id });
      shop2 = _collections.Shops.findOne({ _id: shop2._id });
      (0, _practicalmeteorChai.expect)(shop.defaultRoles).to.contain("test-all-shops");
      (0, _practicalmeteorChai.expect)(shop2.defaultRoles).to.contain("test-all-shops");
    });

    it("should only add a role to the specified shop", function () {
      var shop = Factory.create("shop");
      var shop2 = Factory.create("shop");
      _api.Reaction.addRolesToDefaultRoleSet({ shops: [shop._id], roles: ["test-certain-shop"], roleSets: ["defaultRoles"] });
      shop = _collections.Shops.findOne({ _id: shop._id });
      shop2 = _collections.Shops.findOne({ _id: shop2._id });
      (0, _practicalmeteorChai.expect)(shop.defaultRoles).to.contain("test-certain-shop");
      (0, _practicalmeteorChai.expect)(shop2.defaultRoles).not.to.contain("test-certain-shop");
    });

    it("should not add any roles if no shops are specified", function () {
      var shop = Factory.create("shop");
      var shop2 = Factory.create("shop");
      _api.Reaction.addRolesToDefaultRoleSet({ shops: [], roles: ["test-no-shop"], roleSets: ["defaultRoles"] });
      shop = _collections.Shops.findOne({ _id: shop._id });
      shop2 = _collections.Shops.findOne({ _id: shop2._id });
      (0, _practicalmeteorChai.expect)(shop.defaultRoles).not.to.contain("test-certain-shop");
      (0, _practicalmeteorChai.expect)(shop2.defaultRoles).not.to.contain("test-certain-shop");
    });

    it("should add multiple roles to a shop", function () {
      var shop = Factory.create("shop");

      _api.Reaction.addRolesToDefaultRoleSet({ shops: [shop._id], roles: ["test1", "test2"], roleSets: ["defaultRoles"] });

      shop = _collections.Shops.findOne({ _id: shop._id });

      (0, _practicalmeteorChai.expect)(shop.defaultRoles).to.contain("test1");
      (0, _practicalmeteorChai.expect)(shop.defaultRoles).to.contain("test2");
    });

    it("should add multiple roles to an array of specified shops", function () {
      var shop = Factory.create("shop");
      var shop2 = Factory.create("shop");
      var shop3 = Factory.create("shop");

      _api.Reaction.addRolesToDefaultRoleSet({ shops: [shop._id, shop2._id], roles: ["test1", "test2"], roleSets: ["defaultRoles"] });

      shop = _collections.Shops.findOne({ _id: shop._id });
      shop2 = _collections.Shops.findOne({ _id: shop2._id });
      shop3 = _collections.Shops.findOne({ _id: shop3._id });

      (0, _practicalmeteorChai.expect)(shop.defaultRoles).to.contain("test1");
      (0, _practicalmeteorChai.expect)(shop.defaultRoles).to.contain("test2");
      (0, _practicalmeteorChai.expect)(shop2.defaultRoles).to.contain("test1");
      (0, _practicalmeteorChai.expect)(shop2.defaultRoles).to.contain("test2");
      (0, _practicalmeteorChai.expect)(shop3.defaultRoles).not.to.contain("test1");
      (0, _practicalmeteorChai.expect)(shop3.defaultRoles).not.to.contain("test2");
    });

    it("should add multiple roles to all shops when specified", function () {
      var shop = Factory.create("shop");
      var shop2 = Factory.create("shop");
      var shop3 = Factory.create("shop");

      _api.Reaction.addRolesToDefaultRoleSet({ allShops: true, roles: ["test1", "test2"], roleSets: ["defaultRoles"] });

      shop = _collections.Shops.findOne({ _id: shop._id });
      shop2 = _collections.Shops.findOne({ _id: shop2._id });
      shop3 = _collections.Shops.findOne({ _id: shop3._id });

      (0, _practicalmeteorChai.expect)(shop.defaultRoles).to.contain("test1");
      (0, _practicalmeteorChai.expect)(shop.defaultRoles).to.contain("test2");
      (0, _practicalmeteorChai.expect)(shop2.defaultRoles).to.contain("test1");
      (0, _practicalmeteorChai.expect)(shop2.defaultRoles).to.contain("test2");
      (0, _practicalmeteorChai.expect)(shop3.defaultRoles).to.contain("test1");
      (0, _practicalmeteorChai.expect)(shop3.defaultRoles).to.contain("test2");
    });

    it("should update allShops when flag is true even if subset of shops are specified", function () {
      var shop = Factory.create("shop");
      var shop2 = Factory.create("shop");
      var shop3 = Factory.create("shop");

      _api.Reaction.addRolesToDefaultRoleSet({ allShops: true, shops: [shop._id, shop2._id], roles: ["test1", "test2"], roleSets: ["defaultRoles"] });

      shop = _collections.Shops.findOne({ _id: shop._id });
      shop2 = _collections.Shops.findOne({ _id: shop2._id });
      shop3 = _collections.Shops.findOne({ _id: shop3._id });

      (0, _practicalmeteorChai.expect)(shop.defaultRoles).to.contain("test1");
      (0, _practicalmeteorChai.expect)(shop.defaultRoles).to.contain("test2");
      (0, _practicalmeteorChai.expect)(shop2.defaultRoles).to.contain("test1");
      (0, _practicalmeteorChai.expect)(shop2.defaultRoles).to.contain("test2");
      (0, _practicalmeteorChai.expect)(shop3.defaultRoles).to.contain("test1");
      (0, _practicalmeteorChai.expect)(shop3.defaultRoles).to.contain("test2");
    });

    it("should add roles to multiple role sets", function () {
      var shop = Factory.create("shop");

      _api.Reaction.addRolesToDefaultRoleSet({ allShops: true, shops: [shop._id], roles: ["test1", "test2"], roleSets: ["defaultRoles", "defaultVisitorRole"] });

      shop = _collections.Shops.findOne({ _id: shop._id });

      (0, _practicalmeteorChai.expect)(shop.defaultRoles).to.contain("test1");
      (0, _practicalmeteorChai.expect)(shop.defaultRoles).to.contain("test2");
      (0, _practicalmeteorChai.expect)(shop.defaultVisitorRole).to.contain("test1");
      (0, _practicalmeteorChai.expect)(shop.defaultVisitorRole).to.contain("test2");
    });

    it("should not add roles to unspecified role sets", function () {
      var shop = Factory.create("shop");

      _api.Reaction.addRolesToDefaultRoleSet({ allShops: true, shops: [shop._id], roles: ["test1", "test2"], roleSets: ["defaultVisitorRole"] });

      shop = _collections.Shops.findOne({ _id: shop._id });

      (0, _practicalmeteorChai.expect)(shop.defaultRoles).not.to.contain("test1");
      (0, _practicalmeteorChai.expect)(shop.defaultRoles).not.to.contain("test2");
      (0, _practicalmeteorChai.expect)(shop.defaultVisitorRole).to.contain("test1");
      (0, _practicalmeteorChai.expect)(shop.defaultVisitorRole).to.contain("test2");
    });

    it("should not add roles to non-extant role sets", function () {
      var shop = Factory.create("shop");

      _api.Reaction.addRolesToDefaultRoleSet({ allShops: true, shops: [shop._id], roles: ["test1", "test2"], roleSets: ["madeupRoleSet"] });

      shop = _collections.Shops.findOne({ _id: shop._id });

      (0, _practicalmeteorChai.expect)(shop.madeupRoleSet).to.equal(undefined);
    });
  });
});