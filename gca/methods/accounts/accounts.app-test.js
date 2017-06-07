"use strict";

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _meteor = require("meteor/meteor");

var _accountsBase = require("meteor/accounts-base");

var _collections = require("/lib/collections");

var _api = require("/server/api");

var _practicalmeteorChai = require("meteor/practicalmeteor:chai");

var _practicalmeteorSinon = require("meteor/practicalmeteor:sinon");

var _shops = require("/server/imports/fixtures/shops");

var _fixtures = require("/server/imports/fixtures");

var _fixtures2 = _interopRequireDefault(_fixtures);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint dot-notation: 0 */
(0, _fixtures2.default)();

before(function () {
  this.timeout(10000);
  _meteor.Meteor._sleepForMs(7000);
});

describe("Account Meteor method ", function () {
  var shopId = void 0;
  var fakeUser = Factory.create("account");
  var originals = {};
  var sandbox = void 0;

  before(function () {
    originals["mergeCart"] = _meteor.Meteor.server.method_handlers["cart/mergeCart"];
    originals["setShipmentAddress"] = _meteor.Meteor.server.method_handlers["cart/setShipmentAddress"];
    originals["setPaymentAddress"] = _meteor.Meteor.server.method_handlers["cart/setPaymentAddress"];
  });

  after(function () {
    _collections.Packages.direct.remove({});
    _collections.Cart.direct.remove({});
    _collections.Accounts.direct.remove({});
    _collections.Orders.direct.remove({});
    _collections.Products.direct.remove({});
    _collections.Shops.direct.remove({});
    if (sandbox) {
      sandbox.restore();
    }
  });

  beforeEach(function () {
    shopId = (0, _shops.getShop)()._id;
    sandbox = _practicalmeteorSinon.sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  function spyOnMethod(method, id) {
    return sandbox.stub(_meteor.Meteor.server.method_handlers, "cart/" + method, function () {
      check(arguments, [Match.Any]); // to prevent audit_arguments from complaining
      this.userId = id;
      return originals[method].apply(this, arguments);
    });
  }

  describe("addressBookAdd", function () {
    beforeEach(function () {
      _collections.Cart.remove({});
      _collections.Accounts.remove({});
    });

    it("should allow user to add new addresses", function (done) {
      var account = Factory.create("account");
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return account.userId;
      });
      var address = (0, _shops.getAddress)();
      // we already have one address by default
      (0, _practicalmeteorChai.expect)(account.profile.addressBook.length).to.equal(1);
      _meteor.Meteor.call("accounts/addressBookAdd", address);
      account = _collections.Accounts.findOne(account._id);
      (0, _practicalmeteorChai.expect)(account.profile.addressBook.length).to.equal(2);
      return done();
    });

    it("should allow Admin to add new addresses to other users", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var account = Factory.create("account");
      var address = (0, _shops.getAddress)();
      (0, _practicalmeteorChai.expect)(account.profile.addressBook.length).to.equal(1);
      _meteor.Meteor.call("accounts/addressBookAdd", address, account.userId);

      account = _collections.Accounts.findOne(account._id);
      (0, _practicalmeteorChai.expect)(account.profile.addressBook.length).to.equal(2);
      return done();
    });

    it("should insert exactly the same address as expected", function (done) {
      var account = Factory.create("account");
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return account.userId;
      });
      var address = (0, _shops.getAddress)();
      _meteor.Meteor.call("accounts/addressBookAdd", address);
      account = _collections.Accounts.findOne(account._id);
      (0, _practicalmeteorChai.expect)(account.profile.addressBook.length).to.equal(2);
      var newAddress = account.profile.addressBook[account.profile.addressBook.length - 1];
      delete newAddress._id;
      (0, _practicalmeteorChai.expect)((0, _isEqual3.default)(address, newAddress)).to.be.true;
      return done();
    });

    it("should throw error if wrong arguments were passed", function (done) {
      var accountSpy = sandbox.spy(_collections.Accounts, "update");

      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookAdd", 123456);
      }).to.throw;

      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookAdd", {});
      }).to.throw;

      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookAdd", null);
      }).to.throw;

      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookAdd");
      }).to.throw;

      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookAdd", "asdad", 123);
      }).to.throw;

      // https://github.com/aldeed/meteor-simple-schema/issues/522
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookAdd", function () {
          (0, _practicalmeteorChai.expect)(true).to.be.true;
        });
      }).to.not.throw;

      (0, _practicalmeteorChai.expect)(accountSpy).to.not.have.been.called;

      return done();
    });

    it("should not let non-Admin add address to another user", function (done) {
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return fakeUser._id;
      });
      var account2 = Factory.create("account");
      var updateAccountSpy = sandbox.spy(_collections.Accounts, "update");
      var upsertAccountSpy = sandbox.spy(_collections.Accounts, "upsert");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookAdd", (0, _shops.getAddress)(), account2._id);
      }).to.throw();
      (0, _practicalmeteorChai.expect)(updateAccountSpy).to.not.have.been.called;
      (0, _practicalmeteorChai.expect)(upsertAccountSpy).to.not.have.been.called;

      return done();
    });

    it("should disabled isShipping/BillingDefault properties inside sibling" + " address if we enable their while adding", function (done) {
      var account = Factory.create("account");
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return account.userId;
      });
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shopId;
      });
      var sessionId = Random.id(); // Required for creating a cart
      spyOnMethod("setShipmentAddress", account.userId);
      spyOnMethod("setPaymentAddress", account.userId);

      _meteor.Meteor.call("cart/createCart", account.userId, sessionId);
      // cart was created without any default addresses, we need to add one
      var address = Object.assign({}, (0, _shops.getAddress)(), {
        isShippingDefault: true,
        isBillingDefault: true
      });
      _meteor.Meteor.call("accounts/addressBookAdd", address);

      // Now we need to override cart with new address
      var newAddress = Object.assign({}, (0, _shops.getAddress)(), {
        _id: Random.id(),
        isShippingDefault: true,
        isBillingDefault: true
      });
      _meteor.Meteor.call("accounts/addressBookAdd", newAddress);

      // now we need to get address ids from cart and compare their
      var cart = _collections.Cart.findOne({ userId: account.userId });
      (0, _practicalmeteorChai.expect)(cart.shipping[0].address._id).to.equal(newAddress._id);
      (0, _practicalmeteorChai.expect)(cart.billing[0].address._id).to.equal(newAddress._id);

      return done();
    });
  });

  describe("addressBookUpdate", function () {
    // Required for creating a cart
    var sessionId = Random.id();
    var removeInventoryStub = void 0;

    before(function () {
      removeInventoryStub = _practicalmeteorSinon.sinon.stub(_meteor.Meteor.server.method_handlers, "inventory/remove", function () {
        check(arguments, [Match.Any]);
        return true;
      });
    });

    after(function () {
      removeInventoryStub.restore();
    });

    beforeEach(function () {
      _collections.Cart.remove({});
      _collections.Accounts.remove({});
    });

    it("should allow user to edit addresses", function (done) {
      var account = Factory.create("account");
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return account.userId;
      });
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shopId;
      });
      sandbox.stub(_api.Reaction, "hasAdminAccess", function () {
        return true;
      });
      spyOnMethod("setShipmentAddress", account.userId);
      spyOnMethod("setPaymentAddress", account.userId);
      var updateAccountSpy = sandbox.spy(_collections.Accounts, "update");

      _meteor.Meteor.call("cart/createCart", account.userId, sessionId);

      // we put new faker address over current address to test all fields
      // at once, but keep current address._id
      var address = Object.assign({}, account.profile.addressBook[0], (0, _shops.getAddress)());
      _meteor.Meteor.call("accounts/addressBookUpdate", address);
      (0, _practicalmeteorChai.expect)(updateAccountSpy).to.have.been.called;

      return done();
    });

    it("should allow Admin to edit other user address", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      sandbox.stub(_api.Reaction, "hasAdminAccess", function () {
        return true;
      });
      var account = Factory.create("account");
      spyOnMethod("setShipmentAddress", account.userId);
      spyOnMethod("setPaymentAddress", account.userId);

      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shopId;
      });
      _meteor.Meteor.call("cart/createCart", account.userId, sessionId);

      // we put new faker address over current address to test all fields
      // at once, but keep current address._id
      var address = Object.assign({}, account.profile.addressBook[0], (0, _shops.getAddress)());
      _meteor.Meteor.call("accounts/addressBookUpdate", address, account.userId);

      // comparing two addresses to equality
      account = _collections.Accounts.findOne(account._id);
      var newAddress = account.profile.addressBook[0];
      (0, _practicalmeteorChai.expect)((0, _isEqual3.default)(address, newAddress)).to.be.true;

      return done();
    });

    it("should update fields to exactly the same what we need", function () {
      var account = Factory.create("account");
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return account.userId;
      });
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shopId;
      });
      spyOnMethod("setShipmentAddress", account.userId);
      spyOnMethod("setPaymentAddress", account.userId);
      _meteor.Meteor.call("cart/createCart", account.userId, sessionId);

      // we put new faker address over current address to test all fields
      // at once, but keep current address._id
      var address = Object.assign({}, account.profile.addressBook[0], (0, _shops.getAddress)());
      _meteor.Meteor.call("accounts/addressBookUpdate", address);

      // comparing two addresses to equality
      account = _collections.Accounts.findOne(account._id);
      var newAddress = account.profile.addressBook[0];
      (0, _practicalmeteorChai.expect)((0, _isEqual3.default)(address, newAddress)).to.be.true;
    });

    it("should throw error if wrong arguments were passed", function () {
      var updateAccountSpy = sandbox.spy(_collections.Accounts, "update");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookUpdate", 123456);
      }).to.throw;
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookUpdate", {});
      }).to.throw;
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookUpdate", null);
      }).to.throw;
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookUpdate");
      }).to.throw;
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookUpdate", "asdad", 123);
      }).to.throw;

      // https://github.com/aldeed/meteor-simple-schema/issues/522
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookUpdate", function () {
          (0, _practicalmeteorChai.expect)(true).to.be.true;
        });
      }).to.not.throw;
      (0, _practicalmeteorChai.expect)(updateAccountSpy).to.not.have.been.called;
    });

    it("should not let non-Admin to edit address of another user", function () {
      var account = Factory.create("account");
      var account2 = Factory.create("account");
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return account.userId;
      });
      var accountUpdateSpy = sandbox.spy(_collections.Accounts, "update");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookUpdate", (0, _shops.getAddress)(), account2._id);
      }).to.throw;
      (0, _practicalmeteorChai.expect)(accountUpdateSpy).to.not.have.been.called;
    });

    it("enabling isShipping/BillingDefault properties should add this address to cart", function () {
      var account = Factory.create("account");
      spyOnMethod("setShipmentAddress", account.userId);
      spyOnMethod("setPaymentAddress", account.userId);
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return account.userId;
      });
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shopId;
      });
      _meteor.Meteor.call("cart/createCart", account.userId, sessionId);
      // first we need to disable defaults, because we already have some
      // random defaults in account, but cart is clean. This is test only
      // situation.
      var address = Object.assign({}, account.profile.addressBook[0], {
        isShippingDefault: false,
        isBillingDefault: false
      });
      _meteor.Meteor.call("accounts/addressBookUpdate", address);
      var cart = _collections.Cart.findOne({ userId: account.userId });
      (0, _practicalmeteorChai.expect)(cart.billing).to.be.defined;
      (0, _practicalmeteorChai.expect)(cart.shipping).to.be.undefined;

      address = Object.assign({}, account.profile.addressBook[0], {
        isShippingDefault: true,
        isBillingDefault: true
      });
      _meteor.Meteor.call("accounts/addressBookUpdate", address);
      cart = _collections.Cart.findOne({ userId: account.userId });
      (0, _practicalmeteorChai.expect)(cart).to.not.be.undefined;

      (0, _practicalmeteorChai.expect)(cart.billing[0].address._id).to.equal(address._id);
      (0, _practicalmeteorChai.expect)(cart.shipping[0].address._id).to.equal(address._id);
    });

    it("should disable isShipping/BillingDefault properties inside sibling" + " address if we enable them while editing", function (done) {
      var account = Factory.create("account");
      spyOnMethod("setShipmentAddress", account.userId);
      spyOnMethod("setPaymentAddress", account.userId);
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return account.userId;
      });
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shopId;
      });
      _meteor.Meteor.call("cart/createCart", account.userId, sessionId);
      // cart was created without any default addresses, we need to add one
      var address = Object.assign({}, account.profile.addressBook[0], {
        isShippingDefault: true,
        isBillingDefault: true
      });
      _meteor.Meteor.call("accounts/addressBookUpdate", address);

      // we add new address with disabled defaults
      address = Object.assign({}, (0, _shops.getAddress)(), {
        _id: Random.id(),
        isShippingDefault: false,
        isBillingDefault: false
      });
      _meteor.Meteor.call("accounts/addressBookAdd", address);
      // now we can test edit
      Object.assign(address, {
        isShippingDefault: true,
        isBillingDefault: true
      });
      _meteor.Meteor.call("accounts/addressBookUpdate", address);
      account = _collections.Accounts.findOne(account._id);

      (0, _practicalmeteorChai.expect)(account.profile.addressBook[0].isBillingDefault).to.be.false;
      (0, _practicalmeteorChai.expect)(account.profile.addressBook[0].isShippingDefault).to.be.false;
      return done();
    });

    it("should update cart default addresses via `type` argument", function () {
      var account = Factory.create("account");
      var userId = account.userId;
      spyOnMethod("setShipmentAddress", account.userId);
      spyOnMethod("setPaymentAddress", account.userId);
      sandbox.stub(_api.Reaction, "getShopId", function () {
        return shopId;
      });
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return userId;
      });
      _meteor.Meteor.call("cart/createCart", userId, sessionId);
      // clean account
      _meteor.Meteor.call("accounts/addressBookRemove", account.profile.addressBook[0]._id);
      // preparation
      var address = Object.assign({}, (0, _shops.getAddress)(), {
        _id: Random.id(),
        isShippingDefault: false,
        isBillingDefault: false
      });
      _meteor.Meteor.call("accounts/addressBookAdd", address);
      address = Object.assign(address, {
        isShippingDefault: true,
        isBillingDefault: true
      });

      _meteor.Meteor.call("accounts/addressBookUpdate", address, null, "isBillingDefault");
      _meteor.Meteor.call("accounts/addressBookUpdate", address, null, "isShippingDefault");
      var cart = _collections.Cart.findOne({ userId: userId });
      (0, _practicalmeteorChai.expect)(cart.billing[0].address._id).to.equal(address._id);
      (0, _practicalmeteorChai.expect)(cart.shipping[0].address._id).to.equal(address._id);
    });
  });

  describe("addressBookRemove", function () {
    it("should allow user to remove address", function () {
      var account = Factory.create("account");
      var address = account.profile.addressBook[0];
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return account.userId;
      });
      (0, _practicalmeteorChai.expect)(account.profile.addressBook.length).to.equal(1);
      _meteor.Meteor.call("accounts/addressBookRemove", address._id);
      account = _collections.Accounts.findOne(account._id);
      (0, _practicalmeteorChai.expect)(account.profile.addressBook.length).to.equal(0);
    });

    it("should allow Admin to remove other user address", function () {
      var account = Factory.create("account");
      var address = account.profile.addressBook[0];
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      (0, _practicalmeteorChai.expect)(account.profile.addressBook.length).to.equal(1);
      _meteor.Meteor.call("accounts/addressBookRemove", address._id, account.userId);
      account = _collections.Accounts.findOne(account._id);
      (0, _practicalmeteorChai.expect)(account.profile.addressBook.length).to.equal(0);
    });

    it("should throw error if wrong arguments were passed", function () {
      var updateAccountSpy = sandbox.spy(_collections.Accounts, "update");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookRemove", 123456);
      }).to.throw;
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookRemove", {});
      }).to.throw;
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookRemove", null);
      }).to.throw;
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookRemove");
      }).to.throw;
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookRemove", "asdad", 123);
      }).to.throw;

      // https://github.com/aldeed/meteor-simple-schema/issues/522
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookRemove", function () {
          (0, _practicalmeteorChai.expect)(true).to.be.true;
        });
      }).to.not.throw;
      (0, _practicalmeteorChai.expect)(updateAccountSpy).to.not.have.been.called;
    });

    it("should not let non-Admin to remove address of another user", function () {
      var account = Factory.create("account");
      var account2 = Factory.create("account");
      var address2 = account2.profile.addressBook[0];
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return account.userId;
      });
      var accountUpdateSpy = sandbox.spy(_collections.Accounts, "update");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/addressBookRemove", address2._id, account2.userId);
      }).to.throw;
      (0, _practicalmeteorChai.expect)(accountUpdateSpy).to.not.have.been.called;
    });

    it("should call `cart/unsetAddresses` Method", function () {
      var account = Factory.create("account");
      var address = account.profile.addressBook[0];
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return account.userId;
      });
      var cartUnsetSpy = sandbox.spy(_meteor.Meteor.server.method_handlers, "cart/unsetAddresses");

      _meteor.Meteor.call("accounts/addressBookRemove", address._id);
      (0, _practicalmeteorChai.expect)(cartUnsetSpy).to.have.been.called;
      (0, _practicalmeteorChai.expect)(cartUnsetSpy.args[0][0]).to.equal(address._id);
      (0, _practicalmeteorChai.expect)(cartUnsetSpy.args[0][1]).to.equal(account.userId);
    });

    it("should return zero(0) if address not exists", function () {
      sandbox.stub(_meteor.Meteor, "userId", function () {
        return fakeUser.userId;
      });
      var result = _meteor.Meteor.call("accounts/addressBookRemove", "asdasdasd");
      (0, _practicalmeteorChai.expect)(result).to.equal(0);
    });
  });

  describe("accounts/inviteShopMember", function () {
    it("should not let non-Owners invite a user to the shop", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var createUserSpy = sandbox.spy(_accountsBase.Accounts, "createUser");
      // create user
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/inviteShopMember", shopId, fakeUser.emails[0].address, fakeUser.profile.addressBook[0].fullName);
      }).to.throw(_meteor.Meteor.Error, /Access denied/);
      // expect that createUser shouldnt have run
      (0, _practicalmeteorChai.expect)(createUserSpy).to.not.have.been.called;
      // expect(createUserSpy).to.not.have.been.called.with({
      //   username: fakeUser.profile.addressBook[0].fullName
      // });
    });

    it("should let a Owner invite a user to the shop", function (done) {
      this.timeout(20000);
      this.retries(3);
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      // TODO checking this is failing, even though we can see it happening in the log.
      // spyOn(Email, "send");
      (0, _practicalmeteorChai.expect)(function () {
        return _meteor.Meteor.call("accounts/inviteShopMember", shopId, fakeUser.emails[0].address, fakeUser.profile.addressBook[0].fullName);
      }).to.not.throw(_meteor.Meteor.Error, /Access denied/);
      // expect(Email.send).toHaveBeenCalled();
      return done();
    });
  });
});