"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ShippingPackageConfig = exports.Shipping = exports.ShippingProvider = exports.ShippoShippingProvider = exports.Shipment = exports.ShippoShipment = exports.ShippingParcel = exports.ShipmentItem = exports.ShipmentQuote = exports.ShippingMethod = exports.ShippoShippingMethod = undefined;

var _aldeedSimpleSchema = require("meteor/aldeed:simple-schema");

var _helpers = require("./helpers");

var _address = require("./address");

var _payments = require("./payments");

var _registry = require("./registry");

var _workflow = require("./workflow");

/**
 * ShippoShippingMethod Schema
 * TODO move shippo related schema to shippo module
 * This will only exist in ShippingMethods Inside Cart/Order and not DB shipping Collection
 * as Shippo Methods are Dynamic.
 */

var ShippoShippingMethod = exports.ShippoShippingMethod = new _aldeedSimpleSchema.SimpleSchema({
  serviceLevelToken: {
    type: String,
    optional: true
  },
  rateId: {
    type: String,
    optional: true
  }
});

/**
 * ShippingMethod Schema
 */

var ShippingMethod = exports.ShippingMethod = new _aldeedSimpleSchema.SimpleSchema({
  "_id": {
    type: String,
    label: "Shipment Method Id",
    autoValue: _helpers.schemaIdAutoValue
  },
  "name": {
    type: String,
    label: "Method Name"
  },
  "label": {
    type: String,
    label: "Public Label"
  },
  "group": {
    type: String,
    label: "Group",
    allowedValues: ["Ground", "Priority", "One Day", "Free"]
  },
  "cost": {
    type: Number,
    label: "Cost",
    decimal: true,
    optional: true
  },
  "handling": {
    type: Number,
    label: "Handling",
    optional: true,
    decimal: true,
    defaultValue: 0,
    min: 0
  },
  "rate": {
    type: Number,
    label: "Rate",
    decimal: true,
    min: 0
  },
  "enabled": {
    type: Boolean,
    label: "Enabled",
    defaultValue: false
  },
  "validRanges": {
    type: Array,
    optional: true,
    label: "Matching Cart Ranges"
  },
  "validRanges.$": {
    type: Object,
    optional: true
  },
  "validRanges.$.begin": {
    type: Number,
    decimal: true,
    label: "Begin",
    optional: true
  },
  "validRanges.$.end": {
    type: Number,
    decimal: true,
    label: "End",
    optional: true
  },
  "validLocales": {
    type: Array,
    optional: true,
    label: "Matching Locales"
  },
  "validLocales.$": {
    type: Object,
    optional: true
  },
  "validLocales.$.origination": {
    type: String,
    label: "From",
    optional: true
  },
  "validLocales.$.destination": {
    type: String,
    label: "To",
    optional: true
  },
  "validLocales.$.deliveryBegin": {
    type: Number,
    label: "Shipping Est.",
    optional: true
  },
  "validLocales.$.deliveryEnd": {
    type: Number,
    label: "Delivery Est.",
    optional: true
  },
  "carrier": { // kind of denormalizing, useful for having it in shipmentMethod( cart & order)
    type: String, // Alternatively we can make an extra Schema:ShipmentMethod, that inherits
    optional: true // ShippingMethod and add the optional carrier field
  },
  "settings": {
    type: ShippoShippingMethod,
    optional: true
  }
});

/**
 * ShipmentQuote Schema
 */

var ShipmentQuote = exports.ShipmentQuote = new _aldeedSimpleSchema.SimpleSchema({
  carrier: {
    type: String
  },
  method: {
    type: ShippingMethod
  },
  rate: {
    type: Number,
    decimal: true,
    defaultValue: "0.00"
  }
});

// populate with order.items that are added to a shipment
var ShipmentItem = exports.ShipmentItem = new _aldeedSimpleSchema.SimpleSchema({
  _id: {
    type: String,
    label: "Shipment Line Item",
    optional: true,
    autoValue: _helpers.schemaIdAutoValue
  },
  productId: {
    type: String,
    index: 1
  },
  shopId: {
    type: String,
    index: 1,
    label: "Shipment Item ShopId",
    optional: true
  },
  quantity: {
    label: "Quantity",
    type: Number,
    min: 0
  },
  variantId: {
    type: String
  }
});

/**
 * ShippingParcel Schema
 */

var ShippingParcel = exports.ShippingParcel = new _aldeedSimpleSchema.SimpleSchema({
  containers: {
    type: String,
    optional: true
  },
  length: {
    type: Number,
    optional: true
  },
  width: {
    type: Number,
    optional: true
  },
  height: {
    type: Number,
    optional: true
  },
  weight: {
    type: Number,
    optional: true
  }
});

/**
 * ShippoShipment Schema
 * Specific properties of Shipment for use with Shippo. We don't use
 */

var ShippoShipment = exports.ShippoShipment = new _aldeedSimpleSchema.SimpleSchema({
  transactionId: {
    type: String,
    optional: true
  },
  trackingStatusStatus: { // cause tracking_status.status
    type: String,
    optional: true
  },
  trackingStatusDate: {
    type: String,
    optional: true
  }
});

/**
 * Shipment Schema
 * used for cart/order shipment tracking
 */

var Shipment = exports.Shipment = new _aldeedSimpleSchema.SimpleSchema({
  _id: {
    type: String,
    label: "Shipment Id",
    autoValue: _helpers.schemaIdAutoValue
  },
  paymentId: {
    type: String,
    label: "Payment Id",
    optional: true
  },
  address: {
    type: _address.Address,
    optional: true
  },
  shipmentMethod: {
    type: ShippingMethod,
    optional: true
  },
  shipmentQuotes: {
    type: [ShipmentQuote],
    optional: true
  },
  tracking: {
    type: String,
    optional: true
  },
  parcel: {
    type: ShippingParcel,
    optional: true
  },
  items: {
    type: [ShipmentItem],
    optional: true
  },
  workflow: {
    type: _workflow.Workflow,
    optional: true
  },
  packed: {
    type: Boolean,
    optional: true,
    defaultValue: false
  },
  shipped: {
    type: Boolean,
    optional: true,
    defaultValue: false
  },
  delivered: {
    type: Boolean,
    optional: true,
    defaultValue: false
  },
  invoice: {
    type: _payments.Invoice,
    optional: true
  },
  transactions: {
    type: [Object],
    optional: true,
    blackbox: true
  }, // For printable Shipping label
  shippingLabelUrl: {
    type: String,
    optional: true
  }, // For Customs printable label
  customsLabelUrl: {
    type: String,
    optional: true
  }, // shippo specific properties
  shippo: {
    type: ShippoShipment,
    optional: true
  }
});

/**
 * ShippoShippingProvider Schema
 * Specific  properties for use with Shippo. We don't use
 * ShippingProvider service* fields because Shippo is on level
 * higher service than simple carrier's ,e.g Fedex api.
 */

var ShippoShippingProvider = exports.ShippoShippingProvider = new _aldeedSimpleSchema.SimpleSchema({
  carrierAccountId: {
    type: String,
    optional: true
  }
});

/**
 * ShippingProvider Schema
 */

var ShippingProvider = exports.ShippingProvider = new _aldeedSimpleSchema.SimpleSchema({
  _id: {
    type: String,
    label: "Provider Id",
    optional: true,
    autoValue: _helpers.schemaIdAutoValue
  },
  name: {
    type: String,
    label: "Service Code",
    optional: true
  },
  label: {
    type: String,
    label: "Public Label"
  },
  enabled: {
    type: Boolean,
    defaultValue: true
  },
  serviceAuth: {
    type: String,
    label: "Auth",
    optional: true
  },
  serviceSecret: {
    type: String,
    label: "Secret",
    optional: true
  },
  serviceUrl: {
    type: String,
    label: "Service URL",
    optional: true
  },
  shippoProvider: {
    type: ShippoShippingProvider,
    optional: true
  }
});

/**
 * Shipping Schema
 */

var Shipping = exports.Shipping = new _aldeedSimpleSchema.SimpleSchema({
  _id: {
    type: String,
    label: "Service Id",
    optional: true
  },
  shopId: {
    type: String,
    index: 1,
    autoValue: _helpers.shopIdAutoValue,
    label: "Shipping ShopId"
  },
  name: {
    type: String,
    label: "Service Name",
    optional: true,
    index: 1
  },
  provider: {
    type: ShippingProvider,
    label: "Shipping Provider"
  },
  methods: {
    type: [ShippingMethod],
    optional: true,
    label: "Shipping Methods"
  },
  shipmentQuotes: {
    type: [ShipmentQuote],
    optional: true,
    label: "Quoted Methods"
  }
});

/**
 * Shipping Package Schema
 */
var ShippingPackageConfig = exports.ShippingPackageConfig = new _aldeedSimpleSchema.SimpleSchema([_registry.PackageConfig, {
  "settings.name": {
    type: String,
    defaultValue: "Flat Rate Service"
  }
}]);