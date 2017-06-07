"use strict";

var _dburlesFactory = require("meteor/dburles:factory");

var _practicalmeteorChai = require("meteor/practicalmeteor:chai");

var _practicalmeteorSinon = require("meteor/practicalmeteor:sinon");

var _fixtures = require("/server/imports/fixtures");

var _fixtures2 = _interopRequireDefault(_fixtures);

var _api = require("/server/api");

var _collections = require("/lib/collections");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint dot-notation: 0 */
(0, _fixtures2.default)();

describe("Shop Methods", function () {
  beforeEach(function () {
    return _collections.Shops.remove({});
  });

  after(function () {
    _practicalmeteorSinon.spies.restoreAll();
    _practicalmeteorSinon.stubs.restoreAll();
  });

  it("shop factory should create a new shop", function (done) {
    _practicalmeteorSinon.stubs.create("hasPermissionStub", _api.Reaction, "hasPermission");
    _practicalmeteorSinon.stubs.hasPermissionStub.returns(true);
    _practicalmeteorSinon.spies.create("shopInsertSpy", _collections.Shops, "insert");
    _dburlesFactory.Factory.create("shop");
    (0, _practicalmeteorChai.expect)(_practicalmeteorSinon.spies.shopInsertSpy).to.have.been.called;
    return done();
  });
});

describe("core shop methods", function () {
  var shop = void 0;
  var sandbox = void 0;

  beforeEach(function () {
    sandbox = _practicalmeteorSinon.sinon.sandbox.create();
    shop = _dburlesFactory.Factory.create("shop");
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("shop/createShop", function () {
    beforeEach(function () {
      _collections.Shops.remove({});
    });

    it("should throw 403 error by non admin", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var insertShopSpy = sandbox.spy(_collections.Shops, "insert");
      function createShopFunc() {
        return Meteor.call("shop/createShop");
      }
      (0, _practicalmeteorChai.expect)(createShopFunc).to.throw(Meteor.Error, /Access Denied/);
      (0, _practicalmeteorChai.expect)(insertShopSpy).to.not.have.been.called;
      return done();
    });

    it("should create new shop for admin for userId and shopObject", function () {
      sandbox.stub(Meteor, "userId", function () {
        return "12345678";
      });
      sandbox.stub(_api.Reaction, "hasOwnerAccess", function () {
        return true;
      });
      Meteor.call("shop/createShop", "12345678", shop);
      var newShopCount = _collections.Shops.find({ name: shop.name }).count();
      (0, _practicalmeteorChai.expect)(newShopCount).to.equal(1);
    });
  });
});

describe("shop/changeLayouts", function () {
  it("should replace every layout with the new layout", function () {
    var shop = _dburlesFactory.Factory.create("shop");
    Meteor.call("shop/changeLayouts", shop._id, "myNewLayout");
    var myShop = _collections.Shops.findOne(shop._id);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = myShop.layout[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var layout = _step.value;

        (0, _practicalmeteorChai.expect)(layout.layout).to.equal("myNewLayout");
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
  });
});