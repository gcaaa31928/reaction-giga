"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.methods = undefined;

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _includes2 = require("lodash/includes");

var _includes3 = _interopRequireDefault(_includes2);

var _every2 = require("lodash/every");

var _every3 = _interopRequireDefault(_every2);

exports.orderCreditMethod = orderCreditMethod;
exports.orderDebitMethod = orderDebitMethod;
exports.ordersInventoryAdjust = ordersInventoryAdjust;

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _moment = require("moment");

var _moment2 = _interopRequireDefault(_moment);

var _accountingJs = require("accounting-js");

var _accountingJs2 = _interopRequireDefault(_accountingJs);

var _future = require("fibers/future");

var _future2 = _interopRequireDefault(_future);

var _meteor = require("meteor/meteor");

var _check = require("meteor/check");

var _api = require("/lib/api");

var _collections = require("/lib/collections");

var _schemas = require("/lib/collections/schemas");

var Schemas = _interopRequireWildcard(_schemas);

var _api2 = require("/server/api");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// helper to return the order credit object
// the first credit paymentMethod on the order
// returns entire payment method
function orderCreditMethod(order) {
  return order.billing.filter(function (value) {
    return value.paymentMethod.method === "credit";
  })[0];
}
// helper to return the order debit object
function orderDebitMethod(order) {
  return order.billing.filter(function (value) {
    return value.paymentMethod.method === "debit";
  })[0];
}

/**
 * ordersInventoryAdjust
 * adjust inventory when an order is placed
 * @param {String} orderId - add tracking to orderId
 * @return {null} no return value
 */
function ordersInventoryAdjust(orderId) {
  (0, _check.check)(orderId, String);

  if (!_api2.Reaction.hasPermission("orders")) {
    throw new _meteor.Meteor.Error(403, "Access Denied");
  }

  var order = _collections.Orders.findOne(orderId);
  order.items.forEach(function (item) {
    _collections.Products.update({
      _id: item.variants._id
    }, {
      $inc: {
        inventoryQuantity: -item.quantity
      }
    }, {
      publish: true,
      selector: {
        type: "variant"
      }
    });
  });
}

/**
 * Reaction Order Methods
 */
var methods = exports.methods = {
  /**
   * orders/shipmentPacked
   *
   * @summary update packing status
   * @param {Object} order - order object
   * @param {Object} shipment - shipment object
   * @param {Boolean} packed - packed status
   * @return {Object} return workflow result
   */
  "orders/shipmentPacked": function ordersShipmentPacked(order, shipment, packed) {
    (0, _check.check)(order, Object);
    (0, _check.check)(shipment, Object);
    (0, _check.check)(packed, Boolean);

    if (!_api2.Reaction.hasPermission("orders")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    if (order) {
      _collections.Orders.update({
        "_id": order._id,
        "shipping._id": shipment._id
      }, {
        $set: {
          "shipping.$.packed": packed
        }
      });

      // Set the status of the items as packed
      var itemIds = shipment.items.map(function (item) {
        return item._id;
      });

      var result = _meteor.Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/packed", order, itemIds);
      if (result === 1) {
        return _collections.Orders.update({
          "_id": order._id,
          "shipping._id": shipment._id
        }, {
          $set: {
            "shipping.$.packed": packed
          }
        });
      }
      return result;
    }
  },

  /**
   * orders/makeAdjustmentsToInvoice
   *
   * @summary Update the status of an invoice to allow adjustments to be made
   * @param {Object} order - order object
   * @return {Object} Mongo update
   */
  "orders/makeAdjustmentsToInvoice": function ordersMakeAdjustmentsToInvoice(order) {
    (0, _check.check)(order, Object);

    if (!_api2.Reaction.hasPermission("orders")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    this.unblock();

    return _collections.Orders.update({
      "_id": order._id,
      "billing.paymentMethod.method": "credit"
    }, {
      $set: {
        "billing.$.paymentMethod.status": "adjustments"
      }
    });
  },

  /**
   * orders/approvePayment
   *
   * @summary Approve payment and apply any adjustments
   * @param {Object} order - order object
   * @return {Object} return this.processPayment result
   */
  "orders/approvePayment": function ordersApprovePayment(order) {
    (0, _check.check)(order, Object);
    var invoice = orderCreditMethod(order).invoice;

    if (!_api2.Reaction.hasPermission("orders")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }
    this.unblock();

    // this is server side check to verify
    // that the math all still adds up.
    var subTotal = invoice.subtotal;
    var shipping = invoice.shipping;
    var taxes = invoice.taxes;
    var discount = invoice.discounts;
    var discountTotal = Math.max(0, subTotal - discount); // ensure no discounting below 0.
    var total = _accountingJs2.default.toFixed(discountTotal + shipping + taxes, 2);

    // Updates flattened inventory count on variants in Products collection
    ordersInventoryAdjust(order._id);

    return _collections.Orders.update({
      "_id": order._id,
      "billing.paymentMethod.method": "credit"
    }, {
      $set: {
        "billing.$.paymentMethod.amount": total,
        "billing.$.paymentMethod.status": "approved",
        "billing.$.paymentMethod.mode": "capture",
        "billing.$.invoice.discounts": discount,
        "billing.$.invoice.total": Number(total)
      }
    });
  },

  /**
   * orders/cancelOrder
   *
   * @summary Start the cancel order process
   * @param {Object} order - order object
   * @param {Boolean} returnToStock - condition to return product to stock
   * @return {Object} ret
   */
  "orders/cancelOrder": function ordersCancelOrder(order, returnToStock) {
    (0, _check.check)(order, Object);
    (0, _check.check)(returnToStock, Boolean);

    if (!_api2.Reaction.hasPermission("orders")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    if (!returnToStock) {
      ordersInventoryAdjust(order._id);
    }

    var paymentMethod = orderCreditMethod(order).paymentMethod;
    paymentMethod = Object.assign(paymentMethod, { amount: Number(paymentMethod.amount) });
    var invoiceTotal = order.billing[0].invoice.total;
    var shipment = order.shipping[0];
    var itemIds = shipment.items.map(function (item) {
      return item._id;
    });

    // refund payment to customer
    _meteor.Meteor.call("orders/refunds/create", order._id, paymentMethod, Number(invoiceTotal));

    // send notification to user
    var prefix = _api2.Reaction.getShopPrefix();
    var url = prefix + "/notifications";
    var sms = true;
    _meteor.Meteor.call("notification/send", order.userId, "orderCancelled", url, sms, function (err) {
      if (err) _api2.Logger.error(err);
    });

    // update item workflow
    _meteor.Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/canceled", order, itemIds);

    return _collections.Orders.update({
      "_id": order._id,
      "billing.paymentMethod.method": "credit"
    }, {
      $set: {
        "workflow.status": "coreOrderWorkflow/canceled",
        "billing.$.paymentMethod.mode": "cancel"
      },
      $push: {
        "workflow.workflow": "coreOrderWorkflow/canceled"
      }
    });
  },

  /**
   * orders/processPayment
   *
   * @summary trigger processPayment and workflow update
   * @param {Object} order - order object
   * @return {Object} return this.processPayment result
   */
  "orders/processPayment": function ordersProcessPayment(order) {
    (0, _check.check)(order, Object);

    if (!_api2.Reaction.hasPermission("orders")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    this.unblock();

    return _meteor.Meteor.call("orders/processPayments", order._id, function (error, result) {
      if (result) {
        _meteor.Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "coreProcessPayment", order._id);

        // Set the status of the items as shipped
        var itemIds = order.shipping[0].items.map(function (item) {
          return item._id;
        });

        _meteor.Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/captured", order, itemIds);

        return this.processPayment(order);
      }
      return false;
    });
  },
  /**
   * orders/shipmentShipped
   *
   * @summary trigger shipmentShipped status and workflow update
   * @param {Object} order - order object
   * @param {Object} shipment - shipment object
   * @return {Object} return results of several operations
   */
  "orders/shipmentShipped": function ordersShipmentShipped(order, shipment) {
    (0, _check.check)(order, Object);
    (0, _check.check)(shipment, Object);

    if (!_api2.Reaction.hasPermission("orders")) {
      _api2.Logger.error("User does not have 'orders' permissions");
      throw new _meteor.Meteor.Error("access-denied", "Access Denied");
    }

    this.unblock();

    var completedItemsResult = void 0;
    var completedOrderResult = void 0;

    var itemIds = shipment.items.map(function (item) {
      return item._id;
    });

    // TODO: In the future, this could be handled by shipping delivery status
    _api2.Hooks.Events.run("onOrderShipmentShipped", order, itemIds);
    var workflowResult = _meteor.Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/shipped", order, itemIds);

    if (workflowResult === 1) {
      // Move to completed status for items
      completedItemsResult = _meteor.Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/completed", order, itemIds);

      if (completedItemsResult === 1) {
        // Then try to mark order as completed.
        completedOrderResult = _meteor.Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "completed", order);
      }
    }

    if (order.email) {
      _meteor.Meteor.call("orders/sendNotification", order, "shipped");
    } else {
      _api2.Logger.warn("No order email found. No notification sent.");
    }

    _collections.Orders.update({
      "_id": order._id,
      "shipping._id": shipment._id
    }, {
      $set: {
        "shipping.$.shipped": true
      }
    });

    return {
      workflowResult: workflowResult,
      completedItems: completedItemsResult,
      completedOrder: completedOrderResult
    };
  },

  /**
   * orders/shipmentDelivered
   *
   * @summary trigger shipmentShipped status and workflow update
   * @param {Object} order - order object
   * @return {Object} return workflow result
   */
  "orders/shipmentDelivered": function ordersShipmentDelivered(order) {
    (0, _check.check)(order, Object);

    if (!_api2.Reaction.hasPermission("orders")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    this.unblock();

    var shipment = order.shipping[0];

    if (order.email) {
      _meteor.Meteor.call("orders/sendNotification", order, function (err) {
        if (err) {
          _api2.Logger.error(err, "orders/shipmentDelivered: Failed to send notification");
        }
      });
    } else {
      _api2.Logger.warn("No order email found. No notification sent.");
    }

    var itemIds = shipment.items.map(function (item) {
      return item._id;
    });

    _meteor.Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/delivered", order, itemIds);
    _meteor.Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/completed", order, itemIds);

    var isCompleted = (0, _every3.default)(order.items, function (item) {
      return (0, _includes3.default)(item.workflow.workflow, "coreOrderItemWorkflow/completed");
    });

    _collections.Orders.update({
      "_id": order._id,
      "shipping._id": shipment._id
    }, {
      $set: {
        "shipping.$.delivered": true
      }
    });

    if (isCompleted === true) {
      _api2.Hooks.Events.run("onOrderShipmentDelivered", order._id);
      _meteor.Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "completed", order);
      return true;
    }

    _meteor.Meteor.call("workflow/pushOrderWorkflow", "coreOrderWorkflow", "processing", order);

    return false;
  },

  /**
   * orders/sendNotification
   *
   * @summary send order notification email
   * @param {Object} order - order object
   * @param {Object} action - send notification action
   * @return {Boolean} email sent or not
   */
  "orders/sendNotification": function ordersSendNotification(order, action) {
    (0, _check.check)(order, Object);
    (0, _check.check)(action, Match.OneOf(String, undefined));

    if (!this.userId) {
      _api2.Logger.error("orders/sendNotification: Access denied");
      throw new _meteor.Meteor.Error("access-denied", "Access Denied");
    }

    this.unblock();

    // Get Shop information
    var shop = _collections.Shops.findOne(order.shopId);

    // Get shop logo, if available
    var emailLogo = void 0;
    if (Array.isArray(shop.brandAssets)) {
      var brandAsset = (0, _find3.default)(shop.brandAssets, function (asset) {
        return asset.type === "navbarBrandImage";
      });
      var mediaId = _collections.Media.findOne(brandAsset.mediaId);
      emailLogo = _path2.default.join(_meteor.Meteor.absoluteUrl(), mediaId.url());
    } else {
      emailLogo = _meteor.Meteor.absoluteUrl() + "resources/email-templates/shop-logo.png";
    }

    var billing = orderCreditMethod(order);
    var refundResult = _meteor.Meteor.call("orders/refunds/list", order);
    var refundTotal = 0;

    (0, _each3.default)(refundResult, function (item) {
      refundTotal += parseFloat(item.amount);
    });

    // Get user currency formatting from shops collection, remove saved rate
    var userCurrencyFormatting = (0, _omit3.default)(shop.currencies[billing.currency.userCurrency], ["enabled", "rate"]);

    // Get user currency exchange rate at time of transaction
    var userCurrencyExchangeRate = billing.currency.exchangeRate;

    // Combine same products into single "product" for display purposes
    var combinedItems = [];
    if (order) {
      // Loop through all items in the order. The items are split into indivital items
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        var _loop = function _loop() {
          var orderItem = _step.value;

          // Find an exising item in the combinedItems array
          var foundItem = combinedItems.find(function (combinedItem) {
            // If and item variant exists, then we return true
            if (combinedItem.variants) {
              return combinedItem.variants._id === orderItem.variants._id;
            }

            return false;
          });

          // Increment the quantity count for the duplicate product variants
          if (foundItem) {
            foundItem.quantity++;
          } else {
            // Otherwise push the unique item into the combinedItems array

            // Add displayPrice to match user currency settings
            orderItem.variants.displayPrice = _accountingJs2.default.formatMoney(orderItem.variants.price * userCurrencyExchangeRate, userCurrencyFormatting);

            combinedItems.push(orderItem);

            // Placeholder image if there is no product image
            orderItem.placeholderImage = _meteor.Meteor.absoluteUrl() + "resources/placeholder.gif";

            var variantImage = _collections.Media.findOne({
              "metadata.productId": orderItem.productId,
              "metadata.variantId": orderItem.variants._id
            });
            // variant image
            if (variantImage) {
              orderItem.variantImage = _path2.default.join(_meteor.Meteor.absoluteUrl(), variantImage.url());
            }
            // find a default image
            var productImage = _collections.Media.findOne({ "metadata.productId": orderItem.productId });
            if (productImage) {
              orderItem.productImage = _path2.default.join(_meteor.Meteor.absoluteUrl(), productImage.url());
            }
          }
        };

        for (var _iterator = order.items[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          _loop();
        }

        // Merge data into single object to pass to email template
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

      var dataForEmail = {
        // Shop Data
        shop: shop,
        contactEmail: shop.emails[0].address,
        homepage: _meteor.Meteor.absoluteUrl(),
        emailLogo: emailLogo,
        copyrightDate: (0, _moment2.default)().format("YYYY"),
        legalName: shop.addressBook[0].company,
        physicalAddress: {
          address: shop.addressBook[0].address1 + " " + shop.addressBook[0].address2,
          city: shop.addressBook[0].city,
          region: shop.addressBook[0].region,
          postal: shop.addressBook[0].postal
        },
        shopName: shop.name,
        socialLinks: {
          display: true,
          facebook: {
            display: true,
            icon: _meteor.Meteor.absoluteUrl() + "resources/email-templates/facebook-icon.png",
            link: "https://www.facebook.com"
          },
          googlePlus: {
            display: true,
            icon: _meteor.Meteor.absoluteUrl() + "resources/email-templates/google-plus-icon.png",
            link: "https://plus.google.com"
          },
          twitter: {
            display: true,
            icon: _meteor.Meteor.absoluteUrl() + "resources/email-templates/twitter-icon.png",
            link: "https://www.twitter.com"
          }
        },
        // Order Data
        order: order,
        billing: {
          address: {
            address: billing.address.address1,
            city: billing.address.city,
            region: billing.address.region,
            postal: billing.address.postal
          },
          paymentMethod: billing.paymentMethod.storedCard || billing.paymentMethod.processor,
          subtotal: _accountingJs2.default.formatMoney(billing.invoice.subtotal * userCurrencyExchangeRate, userCurrencyFormatting),
          shipping: _accountingJs2.default.formatMoney(billing.invoice.shipping * userCurrencyExchangeRate, userCurrencyFormatting),
          taxes: _accountingJs2.default.formatMoney(billing.invoice.taxes * userCurrencyExchangeRate, userCurrencyFormatting),
          discounts: _accountingJs2.default.formatMoney(billing.invoice.discounts * userCurrencyExchangeRate, userCurrencyFormatting),
          refunds: _accountingJs2.default.formatMoney(refundTotal * userCurrencyExchangeRate, userCurrencyFormatting),
          total: _accountingJs2.default.formatMoney(billing.invoice.total * userCurrencyExchangeRate, userCurrencyFormatting),
          adjustedTotal: _accountingJs2.default.formatMoney((billing.paymentMethod.amount - refundTotal) * userCurrencyExchangeRate, userCurrencyFormatting)
        },
        combinedItems: combinedItems,
        orderDate: (0, _moment2.default)(order.createdAt).format("MM/DD/YYYY"),
        orderUrl: (0, _api.getSlug)(shop.name) + "/cart/completed?_id=" + order.cartId,
        shipping: {
          tracking: order.shipping[0].tracking,
          carrier: order.shipping[0].shipmentMethod.carrier,
          address: {
            address: order.shipping[0].address.address1,
            city: order.shipping[0].address.city,
            region: order.shipping[0].address.region,
            postal: order.shipping[0].address.postal
          }
        }
      };

      _api2.Logger.debug("orders/sendNotification status: " + order.workflow.status);

      // handle missing root shop email
      if (!shop.emails[0].address) {
        shop.emails[0].address = "no-reply@reactioncommerce.com";
        _api2.Logger.warn("No shop email configured. Using no-reply to send mail");
      }

      // anonymous users without emails.
      if (!order.email) {
        var msg = "No order email found. No notification sent.";
        _api2.Logger.warn(msg);
        throw new _meteor.Meteor.Error("email-error", msg);
      }

      // Compile Email with SSR
      var subject = void 0;
      var tpl = void 0;

      if (action === "shipped") {
        tpl = "orders/shipped";
        subject = "orders/shipped/subject";
      } else if (action === "refunded") {
        tpl = "orders/refunded";
        subject = "orders/refunded/subject";
      } else {
        tpl = "orders/" + order.workflow.status;
        subject = "orders/" + order.workflow.status + "/subject";
      }

      SSR.compileTemplate(tpl, _api2.Reaction.Email.getTemplate(tpl));
      SSR.compileTemplate(subject, _api2.Reaction.Email.getSubject(tpl));

      _api2.Reaction.Email.send({
        to: order.email,
        from: shop.name + " <" + shop.emails[0].address + ">",
        subject: SSR.render(subject, dataForEmail),
        html: SSR.render(tpl, dataForEmail)
      });

      return true;
    }
    return false;
  },

  /**
   * orders/updateShipmentTracking
   * @summary Adds tracking information to order without workflow update.
   * Call after any tracking code is generated
   * @param {Object} order - An Order object
   * @param {Object} shipment - A Shipment object
   * @param {String} tracking - tracking id
   * @return {String} returns order update result
   */
  "orders/updateShipmentTracking": function ordersUpdateShipmentTracking(order, shipment, tracking) {
    (0, _check.check)(order, Object);
    (0, _check.check)(shipment, Object);
    (0, _check.check)(tracking, String);

    if (!_api2.Reaction.hasPermission("orders")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    return _collections.Orders.update({
      "_id": order._id,
      "shipping._id": shipment._id
    }, {
      $set: _defineProperty({}, "shipping.$.tracking", tracking)
    });
  },

  /**
   * orders/addOrderEmail
   * @summary Adds email to order, used for guest users
   * @param {String} cartId - add tracking to orderId
   * @param {String} email - valid email address
   * @return {String} returns order update result
   */
  "orders/addOrderEmail": function ordersAddOrderEmail(cartId, email) {
    (0, _check.check)(cartId, String);
    (0, _check.check)(email, String);
    /**
    *Instead of checking the Orders permission, we should check if user is
    *connected.This is only needed for guest where email is
    *provided for tracking order progress.
    */

    if (!_meteor.Meteor.userId()) {
      throw new _meteor.Meteor.Error(403, "Access Denied. You are not connected.");
    }

    return _collections.Orders.update({
      cartId: cartId
    }, {
      $set: {
        email: email
      }
    });
  },

  /**
   * orders/updateHistory
   * @summary adds order history item for tracking and logging order updates
   * @param {String} orderId - add tracking to orderId
   * @param {String} event - workflow event
   * @param {String} value - event value
   * @return {String} returns order update result
   */
  "orders/updateHistory": function ordersUpdateHistory(orderId, event, value) {
    (0, _check.check)(orderId, String);
    (0, _check.check)(event, String);
    (0, _check.check)(value, Match.Optional(String));

    if (!_api2.Reaction.hasPermission("orders")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    return _collections.Orders.update(orderId, {
      $addToSet: {
        history: {
          event: event,
          value: value,
          userId: _meteor.Meteor.userId(),
          updatedAt: new Date()
        }
      }
    });
  },

  /**
   * orders/capturePayments
   * @summary Finalize any payment where mode is "authorize"
   * and status is "approved", reprocess as "capture"
   * @todo: add tests working with new payment methods
   * @todo: refactor to use non Meteor.namespace
   * @param {String} orderId - add tracking to orderId
   * @return {null} no return value
   */
  "orders/capturePayments": function ordersCapturePayments(orderId) {
    (0, _check.check)(orderId, String);

    if (!_api2.Reaction.hasPermission("orders")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    var order = _collections.Orders.findOne(orderId);
    var itemIds = order.shipping[0].items.map(function (item) {
      return item._id;
    });

    _meteor.Meteor.call("workflow/pushItemWorkflow", "coreOrderItemWorkflow/captured", order, itemIds);

    // process order..payment.paymentMethod
    (0, _each3.default)(order.billing, function (billing) {
      var paymentMethod = billing.paymentMethod;
      var transactionId = paymentMethod.transactionId;

      if (paymentMethod.mode === "capture" && paymentMethod.status === "approved" && paymentMethod.processor) {
        // Grab the amount from the shipment, otherwise use the original amount
        var processor = paymentMethod.processor.toLowerCase();

        _meteor.Meteor.call(processor + "/payment/capture", paymentMethod, function (error, result) {
          if (result && result.saved === true) {
            var metadata = Object.assign(billing.paymentMethod.metadata || {}, result.metadata || {});

            _collections.Orders.update({
              "_id": orderId,
              "billing.paymentMethod.transactionId": transactionId
            }, {
              $set: {
                "billing.$.paymentMethod.mode": "capture",
                "billing.$.paymentMethod.status": "completed",
                "billing.$.paymentMethod.metadata": metadata
              },
              $push: {
                "billing.$.paymentMethod.transactions": result
              }
            });

            // event onOrderPaymentCaptured used for confirmation hooks
            // ie: confirmShippingMethodForOrder is triggered here
            _api2.Hooks.Events.run("onOrderPaymentCaptured", orderId);
          } else {
            if (result && result.error) {
              _api2.Logger.fatal("Failed to capture transaction.", order, paymentMethod.transactionId, result.error);
            } else {
              _api2.Logger.fatal("Failed to capture transaction.", order, paymentMethod.transactionId, error);
            }

            _collections.Orders.update({
              "_id": orderId,
              "billing.paymentMethod.transactionId": transactionId
            }, {
              $set: {
                "billing.$.paymentMethod.mode": "capture",
                "billing.$.paymentMethod.status": "error"
              },
              $push: {
                "billing.$.paymentMethod.transactions": result
              }
            });

            return { error: "orders/capturePayments: Failed to capture transaction" };
          }
          return { error: error, result: result };
        });
      }
    });
  },

  /**
   * orders/refund/list
   * loop through order's payments and find existing refunds.
   * @summary Get a list of refunds for a particular payment method.
   * @param {Object} order - order object
   * @return {null} no return value
   */
  "orders/refunds/list": function ordersRefundsList(order) {
    (0, _check.check)(order, Object);
    var paymentMethod = orderCreditMethod(order).paymentMethod;

    if (!this.userId === order.userId && !_api2.Reaction.hasPermission("orders")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }

    this.unblock();

    var future = new _future2.default();
    var processor = paymentMethod.processor.toLowerCase();

    _meteor.Meteor.call(processor + "/refund/list", paymentMethod, function (error, result) {
      if (error) {
        future.return(error);
      } else {
        (0, _check.check)(result, [Schemas.Refund]);
        future.return(result);
      }
    });

    return future.wait();
  },

  /**
   * orders/refund/create
   *
   * @summary Apply a refund to an already captured order
   * @param {String} orderId - order object
   * @param {Object} paymentMethod - paymentMethod object
   * @param {Number} amount - Amount of the refund, as a positive number
   * @return {null} no return value
   */
  "orders/refunds/create": function ordersRefundsCreate(orderId, paymentMethod, amount) {
    (0, _check.check)(orderId, String);
    (0, _check.check)(paymentMethod, _api2.Reaction.Schemas.PaymentMethod);
    (0, _check.check)(amount, Number);

    if (!_api2.Reaction.hasPermission("orders")) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }
    var processor = paymentMethod.processor.toLowerCase();
    var order = _collections.Orders.findOne(orderId);
    var transactionId = paymentMethod.transactionId;

    var packageId = paymentMethod.paymentPackageId;
    var settingsKey = paymentMethod.paymentSettingsKey;
    // check if payment provider supports de-authorize
    var checkSupportedMethods = _collections.Packages.findOne({
      _id: packageId,
      shopId: _api2.Reaction.getShopId()
    }).settings[settingsKey].support;

    var orderStatus = paymentMethod.status;
    var orderMode = paymentMethod.mode;

    var result = void 0;
    var query = {};
    if ((0, _includes3.default)(checkSupportedMethods, "De-authorize")) {
      result = _meteor.Meteor.call(processor + "/payment/deAuthorize", paymentMethod, amount);
      query = {
        $push: {
          "billing.$.paymentMethod.transactions": result
        }
      };
      // Send email to notify cuustomer of a refund
      _meteor.Meteor.call("orders/sendNotification", order);
      if (result.saved === false) {
        _api2.Logger.fatal("Attempt for de-authorize transaction failed", order._id, paymentMethod.transactionId, result.error);
        throw new _meteor.Meteor.Error("Attempt to de-authorize transaction failed", result.error);
      }
    } else if (orderStatus === "completed" && orderMode === "capture") {
      result = _meteor.Meteor.call(processor + "/refund/create", paymentMethod, amount);
      query = {
        $push: {
          "billing.$.paymentMethod.transactions": result
        }
      };
      // Send email to notify cuustomer of a refund
      _meteor.Meteor.call("orders/sendNotification", order, "refunded");
      if (result.saved === false) {
        _api2.Logger.fatal("Attempt for refund transaction failed", order._id, paymentMethod.transactionId, result.error);
        throw new _meteor.Meteor.Error("Attempt to refund transaction failed", result.error);
      }
    }

    _collections.Orders.update({
      "_id": orderId,
      "billing.paymentMethod.transactionId": transactionId
    }, {
      $set: {
        "billing.$.paymentMethod.status": "refunded"
      },
      query: query
    });

    _api2.Hooks.Events.run("onOrderRefundCreated", orderId);
  }
};

_meteor.Meteor.methods(methods);