"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Logs = exports.Sms = exports.Notifications = exports.Translations = exports.Themes = exports.Templates = exports.Tags = exports.Shops = exports.Shipping = exports.Revisions = exports.Products = exports.Packages = exports.Orders = exports.Inventory = exports.Emails = exports.Cart = exports.Assets = exports.AnalyticsEvents = exports.Accounts = undefined;

var _mongo = require("meteor/mongo");

var _schemas = require("./schemas");

var Schemas = _interopRequireWildcard(_schemas);

var _cart = require("./transform/cart");

var _order = require("./transform/order");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
*
* Reaction Core Collections
*
*/

/**
 * Accounts Collection
 */
var Accounts = exports.Accounts = new _mongo.Mongo.Collection("Accounts");

Accounts.attachSchema(Schemas.Accounts);

/*
 *  AnalyticsEvents Collection
 *  Store the Analytics Events in a Collection
 */
var AnalyticsEvents = exports.AnalyticsEvents = new _mongo.Mongo.Collection("AnalyticsEvents");

AnalyticsEvents.attachSchema(Schemas.AnalyticsEvents);

/**
 *  Assets Collection
 *  Store file asset paths or contents in a Collection
 */
var Assets = exports.Assets = new _mongo.Mongo.Collection("Assets");

Assets.attachSchema(Schemas.Assets);

/**
* Cart Collection
*/
var Cart = exports.Cart = new _mongo.Mongo.Collection("Cart", {
  transform: function transform(cart) {
    var newInstance = Object.create(_cart.cartTransform);
    return _.extend(newInstance, cart);
  }
});

Cart.attachSchema(Schemas.Cart);

/**
* Emails Collection
*/
var Emails = exports.Emails = new _mongo.Mongo.Collection("Emails");

Emails.attachSchema(Schemas.Emails);

/**
* Inventory Collection
*/
var Inventory = exports.Inventory = new _mongo.Mongo.Collection("Inventory");

Inventory.attachSchema(Schemas.Inventory);

/**
* Orders Collection
*/
var Orders = exports.Orders = new _mongo.Mongo.Collection("Orders", {
  transform: function transform(order) {
    var newInstance = Object.create(_order.orderTransform);
    return _.extend(newInstance, order);
  }
});

Orders.attachSchema([Schemas.Cart, Schemas.Order, Schemas.OrderItem]);

/**
* Packages Collection
*/
var Packages = exports.Packages = new _mongo.Mongo.Collection("Packages");

Packages.attachSchema(Schemas.PackageConfig);

/**
* Products Collection
*/
var Products = exports.Products = new _mongo.Mongo.Collection("Products");

Products.attachSchema(Schemas.Product, { selector: { type: "simple" } });
Products.attachSchema(Schemas.ProductVariant, { selector: { type: "variant" } });

/**
* Revisions Collection
*/
var Revisions = exports.Revisions = new _mongo.Mongo.Collection("Revisions");

Revisions.attachSchema(Schemas.Revisions);

/**
* Shipping Collection
*/
var Shipping = exports.Shipping = new _mongo.Mongo.Collection("Shipping");

Shipping.attachSchema(Schemas.Shipping);

/**
* Shops Collection
*/
var Shops = exports.Shops = new _mongo.Mongo.Collection("Shops");

Shops.attachSchema(Schemas.Shop);

/**
* Tags Collection
*/
var Tags = exports.Tags = new _mongo.Mongo.Collection("Tags");

Tags.attachSchema(Schemas.Tag);

/**
* Templates Collection
*/
var Templates = exports.Templates = new _mongo.Mongo.Collection("Templates");

Templates.attachSchema(Schemas.Templates, { selector: { type: "template" } });
Templates.attachSchema(Schemas.ReactLayout, { selector: { type: "react" } });

/**
* Themes Collection
*/
var Themes = exports.Themes = new _mongo.Mongo.Collection("Themes");

Themes.attachSchema(Schemas.Themes);

/**
* Translations Collection
*/
var Translations = exports.Translations = new _mongo.Mongo.Collection("Translations");

Translations.attachSchema(Schemas.Translation);

/**
 * Notifications Collection
 */
var Notifications = exports.Notifications = new _mongo.Mongo.Collection("Notifications");

Notifications.attachSchema(Schemas.Notification);

/**
 * Sms Collection
 */
var Sms = exports.Sms = new _mongo.Mongo.Collection("Sms");

Sms.attachSchema(Schemas.Sms);

/**
 * Logs Collection
 */
var Logs = exports.Logs = new _mongo.Mongo.Collection("Logs");

Logs.attachSchema(Schemas.Logs);