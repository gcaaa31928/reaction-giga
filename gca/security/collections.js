"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  /*
   * Define some additional rule chain methods
   */
  // use this rule for collections other than Shops
  // matches this.shopId
  Security.defineMethod("ifShopIdMatches", {
    fetch: [],
    deny: function deny(type, arg, userId, doc) {
      return doc.shopId !== _api.Reaction.getShopId();
    }
  });
  // this rule is for the Shops collection
  // use ifShopIdMatches for match on this._id
  Security.defineMethod("ifShopIdMatchesThisId", {
    fetch: [],
    deny: function deny(type, arg, userId, doc) {
      return doc._id !== _api.Reaction.getShopId();
    }
  });

  Security.defineMethod("ifFileBelongsToShop", {
    fetch: [],
    deny: function deny(type, arg, userId, doc) {
      return doc.metadata.shopId !== _api.Reaction.getShopId();
    }
  });

  Security.defineMethod("ifUserIdMatches", {
    fetch: [],
    deny: function deny(type, arg, userId, doc) {
      return userId && doc.userId && doc.userId !== userId || doc.userId && !userId;
    }
  });

  Security.defineMethod("ifUserIdMatchesProp", {
    fetch: [],
    deny: function deny(type, arg, userId, doc) {
      return doc[arg] !== userId;
    }
  });

  // todo do we need this?
  Security.defineMethod("ifSessionIdMatches", {
    fetch: [],
    deny: function deny(type, arg, userId, doc) {
      return doc.sessionId !== _api.Reaction.sessionId;
    }
  });

  /**
   * Define all security rules
   */

  /**
   * admin security
   * Permissive security for users with the "admin" role
   */

  Security.permit(["insert", "update", "remove"]).collections([Accounts, Products, Tags, Translations, Shipping, Orders, Packages, Templates, Jobs]).ifHasRole({
    role: "admin",
    group: _api.Reaction.getShopId()
  }).ifShopIdMatches().exceptProps(["shopId"]).allowInClientCode();

  /*
   * Permissive security for users with the "admin" role for FS.Collections
   */

  Security.permit(["insert", "update", "remove"]).collections([Media]).ifHasRole({
    role: ["admin", "owner", "createProduct"],
    group: _api.Reaction.getShopId()
  }).ifFileBelongsToShop().allowInClientCode();

  /*
   * Users with the "admin" or "owner" role may update and
   * remove their shop but may not insert one.
   */

  Shops.permit(["update", "remove"]).ifHasRole({
    role: ["admin", "owner"],
    group: _api.Reaction.getShopId()
  }).ifShopIdMatchesThisId().allowInClientCode();

  /*
   * Users with the "admin" or "owner" role may update and
   * remove products, but createProduct allows just for just a product editor
   */

  Products.permit(["insert", "update", "remove"]).ifHasRole({
    role: ["createProduct"],
    group: _api.Reaction.getShopId()
  }).ifShopIdMatches().allowInClientCode();

  /*
   * Users with the "owner" role may remove orders for their shop
   */

  Orders.permit("remove").ifHasRole({
    role: ["admin", "owner"],
    group: _api.Reaction.getShopId()
  }).ifShopIdMatches().exceptProps(["shopId"]).allowInClientCode();

  /*
   * Can update cart from client. Must insert/remove carts using
   * server methods.
   * Can update all session carts if not logged in or user cart if logged in as that user
   * XXX should verify session match, but doesn't seem possible? Might have to move all cart updates to server methods, too?
   */

  Cart.permit(["insert", "update", "remove"]).ifHasRole({
    role: ["anonymous", "guest"],
    group: _api.Reaction.getShopId()
  }).ifShopIdMatches().ifUserIdMatches().ifSessionIdMatches().allowInClientCode();

  /*
   * Users may update their own account
   */
  Collections.Accounts.permit(["insert", "update"]).ifHasRole({
    role: ["anonymous", "guest"],
    group: _api.Reaction.getShopId()
  }).ifUserIdMatches().allowInClientCode();

  /*
   * apply download permissions to file collections
   */
  _.each([Media], function (fsCollection) {
    return fsCollection.allow({
      download: function download() {
        return true;
      }
    });
  });

  /**
   * Emails - Deny all client side ops
   */
  Emails.deny({
    insert: function insert() {
      return true;
    },
    update: function update() {
      return true;
    },
    remove: function remove() {
      return true;
    }
  });
};

var _collections = require("/lib/collections");

var Collections = _interopRequireWildcard(_collections);

var _api = require("/server/api");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var Accounts = Collections.Accounts,
    Cart = Collections.Cart,
    Packages = Collections.Packages,
    Emails = Collections.Emails,
    Jobs = Collections.Jobs,
    Media = Collections.Media,
    Orders = Collections.Orders,
    Products = Collections.Products,
    Shipping = Collections.Shipping,
    Shops = Collections.Shops,
    Tags = Collections.Tags,
    Templates = Collections.Templates,
    Translations = Collections.Translations;

/**
 * security definitions
 *
 * The following security definitions use the ongoworks:security package.
 * Rules within a single chain stack with AND relationship. Multiple
 * chains for the same collection stack with OR relationship.
 * See https://github.com/ongoworks/meteor-security
 *
 * It"s important to note that these security rules are for inserts,
 * updates, and removes initiated from untrusted (client) code.
 * Thus there may be other actions that certain roles are allowed to
 * take, but they do not necessarily need to be listed here if the
 * database operation is executed in a server method.
 */