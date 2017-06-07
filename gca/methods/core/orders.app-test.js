"use strict";

var _accountingJs = require("accounting-js");

var _accountingJs2 = _interopRequireDefault(_accountingJs);

var _meteor = require("meteor/meteor");

var _dburlesFactory = require("meteor/dburles:factory");

var _practicalmeteorChai = require("meteor/practicalmeteor:chai");

var _practicalmeteorSinon = require("meteor/practicalmeteor:sinon");

var _fixtures = require("/server/imports/fixtures");

var _fixtures2 = _interopRequireDefault(_fixtures);

var _api = require("/server/api");

var _collections = require("/lib/collections");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _fixtures2.default)();
// examplePaymentMethod();

describe("orders test", function () {
  var methods = void 0;
  var sandbox = void 0;
  var order = void 0;
  var example = void 0;
  var shop = void 0;

  before(function (done) {
    methods = {
      "cancelOrder": _meteor.Meteor.server.method_handlers["orders/cancelOrder"],
      "shipmentPacked": _meteor.Meteor.server.method_handlers["orders/shipmentPacked"],
      "makeAdjustmentsToInvoice": _meteor.Meteor.server.method_handlers["orders/makeAdjustmentsToInvoice"],
      "approvePayment": _meteor.Meteor.server.method_handlers["orders/approvePayment"],
      "shipmentShipped": _meteor.Meteor.server.method_handlers["orders/shipmentShipped"],
      "shipmentDelivered": _meteor.Meteor.server.method_handlers["orders/shipmentDelivered"],
      "sendNotification": _meteor.Meteor.server.method_handlers["orders/sendNotification"],
      "updateShipmentTracking": _meteor.Meteor.server.method_handlers["orders/updateShipmentTracking"],
      "addOrderEmail": _meteor.Meteor.server.method_handlers["orders/addOrderEmail"],
      "updateHistory": _meteor.Meteor.server.method_handlers["orders/updateHistory"],
      "capturePayments": _meteor.Meteor.server.method_handlers["orders/capturePayments"],
      "refunds/list": _meteor.Meteor.server.method_handlers["orders/refunds/list"],
      "refunds/create": _meteor.Meteor.server.method_handlers["orders/refunds/create"],
      "example/payment/capture": _meteor.Meteor.server.method_handlers["example/payment/capture"]
    };

    example = _dburlesFactory.Factory.create("examplePaymentPackage");
    return done();
  });

  beforeEach(function (done) {
    sandbox = _practicalmeteorSinon.sinon.sandbox.create();
    // });
    sandbox.stub(_collections.Orders._hookAspects.insert.before[0], "aspect");
    sandbox.stub(_collections.Orders._hookAspects.update.before[0], "aspect");
    sandbox.stub(_meteor.Meteor.server.method_handlers, "inventory/register", function () {
      check(arguments, [Match.Any]);
    });
    sandbox.stub(_meteor.Meteor.server.method_handlers, "inventory/sold", function () {
      check(arguments, [Match.Any]);
    });

    shop = _dburlesFactory.Factory.create("shop");
    order = _dburlesFactory.Factory.create("order");
    sandbox.stub(_api.Reaction, "getShopId", function () {
      return order.shopId;
    });
    var paymentMethod = order.billing[0].paymentMethod;
    sandbox.stub(paymentMethod, "paymentPackageId", example._id);
    return done();
  });

  afterEach(function (done) {
    _collections.Orders.remove({});
    sandbox.restore();
    return done();
  });

  function spyOnMethod(method, id) {
    return sandbox.stub(_meteor.Meteor.server.method_handlers, "orders/" + method, function () {
      check(arguments, [Match.Any]); // to prevent audit_arguments from complaining
      this.userId = id;
      return methods[method].apply(this, arguments);
    });
  }

  function orderCreditMethod(orderData) {
    return orderData.billing.filter(function (value) {
      return value.paymentMethod.method === "credit";
    })[0];
  }

  describe("orders/cancelOrder", function () {
    beforeEach(function () {
      sandbox.stub(_meteor.Meteor.server.method_handlers, "orders/sendNotification", function () {
        check(arguments, [Match.Any]);
      });
    });

    it("should return an error if user is not admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var returnToStock = false;
      spyOnMethod("cancelOrder", order.userId);

      function cancelOrder() {
        return _meteor.Meteor.call("orders/cancelOrder", order, returnToStock);
      }
      (0, _practicalmeteorChai.expect)(cancelOrder).to.throw(_meteor.Meteor.Error, /Access Denied/);
    });

    it("should return the product to stock ", function () {
      // Mock user permissions
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var returnToStock = true;
      var previousProduct = _collections.Products.findOne({ _id: order.items[0].variants._id });
      spyOnMethod("cancelOrder", order.userId);
      _meteor.Meteor.call("orders/cancelOrder", order, returnToStock);
      var product = _collections.Products.findOne({ _id: order.items[0].variants._id });
      (0, _practicalmeteorChai.expect)(previousProduct.inventoryQuantity).to.equal(product.inventoryQuantity);
    });

    it("should notify owner of the order, if the order is canceled", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var returnToStock = true;
      spyOnMethod("cancelOrder", order.userId);
      _meteor.Meteor.call("orders/cancelOrder", order, returnToStock);
      var notify = _collections.Notifications.findOne({ to: order.userId, type: "orderCancelled" });
      (0, _practicalmeteorChai.expect)(notify.message).to.equal("Your order was canceled.");
    });

    it("should not return the product to stock", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var returnToStock = false;
      var previousProduct = _collections.Products.findOne({ _id: order.items[0].variants._id });
      spyOnMethod("cancelOrder", order.userId);
      _meteor.Meteor.call("orders/cancelOrder", order, returnToStock);
      var product = _collections.Products.findOne({ _id: order.items[0].variants._id });
      (0, _practicalmeteorChai.expect)(previousProduct.inventoryQuantity).to.equal(product.inventoryQuantity + 1);
    });

    it("should update the payment method status and mode to refunded and canceled respectively ", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var returnToStock = false;
      spyOnMethod("cancelOrder", order.userId);
      _meteor.Meteor.call("orders/cancelOrder", order, returnToStock);
      var Order = _collections.Orders.findOne({ _id: order._id });
      (0, _practicalmeteorChai.expect)(Order.billing[0].paymentMethod.mode).to.equal("cancel");
    });

    it("should change the workflow status of the item to coreOrderItemWorkflow/canceled", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var returnToStock = false;
      spyOnMethod("cancelOrder", order.userId);
      _meteor.Meteor.call("orders/cancelOrder", order, returnToStock);
      var orderItem = _collections.Orders.findOne({ _id: order._id }).items[0];
      (0, _practicalmeteorChai.expect)(orderItem.workflow.status).to.equal("coreOrderItemWorkflow/canceled");
    });
  });

  describe("orders/shipmentPacked", function () {
    it("should throw an error if user is not admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      var shipment = order.shipping[0];
      var packed = true;
      spyOnMethod("shipmentPacked", order, shipment, packed);

      function shipmentPacked() {
        return _meteor.Meteor.call("orders/shipmentPacked", order, shipment, packed);
      }
      (0, _practicalmeteorChai.expect)(shipmentPacked).to.throw(_meteor.Meteor.Error, /Access Denied/);
    });

    it("should update the order item workflow to coreOrderItemWorkflow/packed", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var shipment = order.shipping[0];
      var packed = true;
      spyOnMethod("shipmentPacked", order.userId);
      _meteor.Meteor.call("orders/shipmentPacked", order, shipment, packed);
      var orderItem = _collections.Orders.findOne({ _id: order._id }).items[0];
      (0, _practicalmeteorChai.expect)(orderItem.workflow.status).to.equal("coreOrderItemWorkflow/packed");
    });

    it("should update the shipment as packed", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      var shipment = order.shipping[0];
      var packed = true;
      spyOnMethod("shipmentPacked", order.userId);
      _meteor.Meteor.call("orders/shipmentPacked", order, shipment, packed);
      var orderShipment = _collections.Orders.findOne({ _id: order._id }).shipping[0];
      (0, _practicalmeteorChai.expect)(orderShipment.packed).to.equal(packed);
    });
  });

  describe("orders/makeAdjustmentsToInvoice", function () {
    it("should throw an error if user is not admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      spyOnMethod("makeAdjustmentsToInvoice", order.userId);

      function makeAdjustmentsToInvoice() {
        return _meteor.Meteor.call("orders/makeAdjustmentsToInvoice", order);
      }
      (0, _practicalmeteorChai.expect)(makeAdjustmentsToInvoice).to.throw(_meteor.Meteor.Error, /Access Denied/);
    });

    it("should make adjustment to the invoice", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      spyOnMethod("makeAdjustmentsToInvoice", order.userId);
      _meteor.Meteor.call("orders/makeAdjustmentsToInvoice", order);
      var orderPaymentMethodStatus = _collections.Orders.findOne({ _id: order._id }).billing[0].paymentMethod.status;
      (0, _practicalmeteorChai.expect)(orderPaymentMethodStatus).equal("adjustments");
    });
  });

  describe("orders/approvePayment", function () {
    it("should throw an error if user is not admin", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      spyOnMethod("approvePayment", order.userId);
      function approvePayment() {
        return _meteor.Meteor.call("orders/approvePayment", order);
      }
      (0, _practicalmeteorChai.expect)(approvePayment).to.throw(_meteor.Meteor.Error, /Access Denied/);
    });

    it("should approve payment", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      spyOnMethod("approvePayment", order.userId);
      var invoice = orderCreditMethod(order).invoice;
      var subTotal = invoice.subtotal;
      var shipping = invoice.shipping;
      var taxes = invoice.taxes;
      var discount = invoice.discounts;
      var discountTotal = Math.max(0, subTotal - discount); // ensure no discounting below 0.
      var total = _accountingJs2.default.toFixed(discountTotal + shipping + taxes, 2);
      _meteor.Meteor.call("orders/approvePayment", order);
      var orderBilling = _collections.Orders.findOne({ _id: order._id }).billing[0];
      (0, _practicalmeteorChai.expect)(orderBilling.paymentMethod.status).to.equal("approved");
      (0, _practicalmeteorChai.expect)(orderBilling.paymentMethod.mode).to.equal("capture");
      (0, _practicalmeteorChai.expect)(orderBilling.invoice.discounts).to.equal(discount);
      (0, _practicalmeteorChai.expect)(orderBilling.invoice.total).to.equal(Number(total));
    });
  });

  describe("orders/shipmentShipped", function () {
    it("should throw an error if user does not have permission", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      spyOnMethod("shipmentShipped", order.userId);
      function shipmentShipped() {
        return _meteor.Meteor.call("orders/shipmentShipped", order, order.shipping[0]);
      }
      (0, _practicalmeteorChai.expect)(shipmentShipped).to.throw(_meteor.Meteor.Error, /Access Denied/);
    });

    it("should update the order item workflow status to coreOrderItemWorkflow/completed", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "orders/sendNotification", function () {
        check(arguments, [Match.Any]);
      });
      spyOnMethod("shipmentShipped", order.userId);
      _meteor.Meteor.call("orders/shipmentShipped", order, order.shipping[0]);
      var orderItem = _collections.Orders.findOne({ _id: order._id }).items[0];
      (0, _practicalmeteorChai.expect)(orderItem.workflow.status).to.equal("coreOrderItemWorkflow/completed");
    });

    it("should update the order workflow status to completed", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "orders/sendNotification", function () {
        check(arguments, [Match.Any]);
      });
      spyOnMethod("shipmentShipped", order.userId);
      _meteor.Meteor.call("orders/shipmentShipped", order, order.shipping[0]);
      var orderStatus = _collections.Orders.findOne({ _id: order._id }).workflow.status;
      (0, _practicalmeteorChai.expect)(orderStatus).to.equal("coreOrderWorkflow/completed");
    });

    it("should update the order shipping status", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      sandbox.stub(_meteor.Meteor.server.method_handlers, "orders/sendNotification", function () {
        check(arguments, [Match.Any]);
      });
      spyOnMethod("shipmentShipped", order.userId);
      _meteor.Meteor.call("orders/shipmentShipped", order, order.shipping[0]);
      var orderShipped = _collections.Orders.findOne({ _id: order._id }).shipping[0].shipped;
      (0, _practicalmeteorChai.expect)(orderShipped).to.equal(true);
    });
  });

  describe("orders/shipmentDelivered", function () {
    beforeEach(function () {
      sandbox.stub(_meteor.Meteor.server.method_handlers, "orders/sendNotification", function () {
        check(arguments, [Match.Any]);
      });
    });

    it("should throw an error if user does not have permissions", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      spyOnMethod("shipmentDelivered", order.userId);
      function shipmentDelivered() {
        return _meteor.Meteor.call("orders/shipmentDelivered", order);
      }
      (0, _practicalmeteorChai.expect)(shipmentDelivered).to.throw(_meteor.Meteor.Error, /Access Denied/);
    });

    it("should update the order item workflow to coreOrderItemWorkflow/completed", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      spyOnMethod("shipmentDelivered", order.userId);
      _meteor.Meteor.call("orders/shipmentDelivered", order);
      var orderItemWorkflow = _collections.Orders.findOne({ _id: order._id }).items[0].workflow;
      (0, _practicalmeteorChai.expect)(orderItemWorkflow.status).to.equal("coreOrderItemWorkflow/completed");
    });

    it("should update the delivered status to true", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      spyOnMethod("shipmentDelivered", order.userId);
      _meteor.Meteor.call("orders/shipmentDelivered", order);
      var orderShipping = _collections.Orders.findOne({ _id: order._id }).shipping[0];
      (0, _practicalmeteorChai.expect)(orderShipping.delivered).to.equal(true);
    });

    it("should update the order workflow status to processing", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      spyOnMethod("shipmentDelivered", order.userId);
      _meteor.Meteor.call("orders/shipmentDelivered", order);
      var orderWorkflow = _collections.Orders.findOne({ _id: order._id }).workflow;
      (0, _practicalmeteorChai.expect)(orderWorkflow.status).to.equal("coreOrderWorkflow/processing");
    });
  });

  describe("orders/sendNotification", function () {
    it("should return access denied if userId is not availble", function () {
      spyOnMethod("sendNotification");
      function sendNotification() {
        return _meteor.Meteor.call("orders/sendNotification", order);
      }
      (0, _practicalmeteorChai.expect)(sendNotification).to.throw(_meteor.Meteor.error, /Access Denied/);
    });

    it("should send email notification", function () {
      spyOnMethod("sendNotification", order.userId);
      sandbox.stub(_collections.Media, "findOne", function () {
        // stub url method for media file
        var url = function url() {
          return "/stub/url";
        };
        return {
          url: url
        };
      });
      sandbox.stub(_collections.Shops, "findOne", function () {
        return shop;
      });
      var result = _meteor.Meteor.call("orders/sendNotification", order);
      (0, _practicalmeteorChai.expect)(result).to.be.true;
    });
  });

  describe("orders/updateShipmentTracking", function () {
    it("should return an error if user does not have permission", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      spyOnMethod("updateShipmentTracking", order.userId);
      function updateShipmentTracking() {
        var trackingValue = "2340FLKD104309";
        return _meteor.Meteor.call("orders/updateShipmentTracking", order, order.shipping[0], trackingValue);
      }
      (0, _practicalmeteorChai.expect)(updateShipmentTracking).to.throw(_meteor.Meteor.error, /Access Denied/);
    });

    it("should update the order tracking value", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      spyOnMethod("updateShipmentTracking", order.userId);
      var trackingValue = "2340FLKD104309";
      _meteor.Meteor.call("orders/updateShipmentTracking", order, order.shipping[0], trackingValue);
      var orders = _collections.Orders.findOne({ _id: order._id });
      (0, _practicalmeteorChai.expect)(orders.shipping[0].tracking).to.equal(trackingValue);
    });
  });

  describe("orders/addOrderEmail", function () {
    it("should return if userId is not available", function () {
      spyOnMethod("addOrderEmail");
      function addOrderEmail() {
        var email = "sample@email.com";
        return _meteor.Meteor.call("orders/addOrderEmail", order.cartId, email);
      }
      (0, _practicalmeteorChai.expect)(addOrderEmail).to.throw(_meteor.Meteor.error, /Access Denied. You are not connected./);
    });

    it("should add the email to the order", function () {
      spyOnMethod("addOrderEmail", order.userId);
      var email = "sample@email.com";
      _meteor.Meteor.call("orders/addOrderEmail", order.cartId, email);
      var orders = _collections.Orders.findOne({ _id: order._id });
      (0, _practicalmeteorChai.expect)(orders.email).to.equal(email);
    });
  });

  describe("orders/updateHistory", function () {
    it("should return Access denied if user does not have permission", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      spyOnMethod("updateHistory", order.userId);
      function updateHistory() {
        var trackingValue = "65TFYTGFCHCUJVR66";
        return _meteor.Meteor.call("orders/updateHistory", order._id, "Tracking added", trackingValue);
      }
      (0, _practicalmeteorChai.expect)(updateHistory).to.throw(_meteor.Meteor.error, /Access Denied/);
    });

    it("should update the order history for the item", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      spyOnMethod("updateHistory", order.userId);
      var trackingValue = "65TFYTGFCHCUJVR66";
      var event = "Tracking added";
      _meteor.Meteor.call("orders/updateHistory", order._id, event, trackingValue);
      var orders = _collections.Orders.findOne({ _id: order._id });
      (0, _practicalmeteorChai.expect)(orders.history[0].event).to.equal(event);
      (0, _practicalmeteorChai.expect)(orders.history[0].value).to.equal(trackingValue);
      (0, _practicalmeteorChai.expect)(orders.history[0].userId).to.equal(order.userId);
    });
  });

  describe("orders/capturePayments", function () {
    beforeEach(function (done) {
      _collections.Orders.update({
        "_id": order._id,
        "billing.paymentMethod.transactionId": order.billing[0].paymentMethod.transactionId
      }, {
        $set: {
          "billing.$.paymentMethod.mode": "capture",
          "billing.$.paymentMethod.status": "approved"
        }
      });
      return done();
    });

    it("should return access denied if user does not have access", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      spyOnMethod("capturePayments", order.userId);
      function capturePayments() {
        return _meteor.Meteor.call("orders/capturePayments", order._id);
      }
      (0, _practicalmeteorChai.expect)(capturePayments).to.throw(_meteor.Meteor.error, /Access Denied/);
    });

    it("should update the order item workflow to coreOrderItemWorkflow/captured", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      spyOnMethod("capturePayments", order.userId);
      _meteor.Meteor.call("orders/capturePayments", order._id);
      var orderItemWorkflow = _collections.Orders.findOne({ _id: order._id }).items[0].workflow;
      (0, _practicalmeteorChai.expect)(orderItemWorkflow.status).to.equal("coreOrderItemWorkflow/captured");
    });

    it("should update the order after the payment processor has captured the payment", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      spyOnMethod("capturePayments", order.userId);
      _meteor.Meteor.call("orders/capturePayments", order._id, function () {
        var orderPaymentMethod = _collections.Orders.findOne({ _id: order._id }).billing[0].paymentMethod;
        (0, _practicalmeteorChai.expect)(orderPaymentMethod.mode).to.equal("capture");
        (0, _practicalmeteorChai.expect)(orderPaymentMethod.status).to.equal("completed");
      });
      return done();
    });

    it("should update order payment method status to error if payment processor fails", function (done) {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      spyOnMethod("capturePayments", order.userId);
      sandbox.stub(_meteor.Meteor.server.method_handlers, "example/payment/capture", function () {
        check(arguments, [Match.Any]);
        return {
          error: "stub error",
          saved: false
        };
      });
      _meteor.Meteor.call("orders/capturePayments", order._id, function () {
        var orderPaymentMethod = _collections.Orders.findOne({ _id: order._id }).billing[0].paymentMethod;
        (0, _practicalmeteorChai.expect)(orderPaymentMethod.mode).to.equal("capture");
        (0, _practicalmeteorChai.expect)(orderPaymentMethod.status).to.equal("error");
      });
      return done();
    });
  });

  describe("orders/refunds/list", function () {
    it("should return an array of refunds", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      spyOnMethod("refunds/list", order.userId);
      _meteor.Meteor.call("orders/refunds/list", order, function (err, res) {
        // refunds would be empty because there isn't any refunds yet
        (0, _practicalmeteorChai.expect)(res.length).to.equal(0);
      });
    });
  });

  describe("orders/refunds/create", function () {
    beforeEach(function () {
      sandbox.stub(_meteor.Meteor.server.method_handlers, "orders/sendNotification", function () {
        check(arguments, [Match.Any]);
      });
    });

    it("should return error if user is does not have admin permissions", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return false;
      });
      spyOnMethod("refunds/create", order.userId);
      function refundsCreate() {
        var amount = 5.20;
        return _meteor.Meteor.call("orders/refunds/create", order._id, order.billing[0].paymentMethod, amount);
      }
      (0, _practicalmeteorChai.expect)(refundsCreate).to.throw(_meteor.Meteor.error, /Access Denied/);
    });

    it("should update the order as refunded", function () {
      sandbox.stub(_api.Reaction, "hasPermission", function () {
        return true;
      });
      spyOnMethod("refunds/create", order.userId);
      var amount = 5.20;
      _meteor.Meteor.call("orders/refunds/create", order._id, order.billing[0].paymentMethod, amount);
      var updateOrder = _collections.Orders.findOne({ _id: order._id });
      (0, _practicalmeteorChai.expect)(updateOrder.billing[0].paymentMethod.status).to.equal("refunded");
    });
  });
});