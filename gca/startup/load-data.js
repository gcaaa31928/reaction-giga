"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  /**
   * Hook to setup core additional imports during Reaction init (shops process first)
   */
  _api.Logger.info("Load default data from /private/data/");

  try {
    _api.Reaction.Import.process(Assets.getText("data/Shops.json"), ["name"], _api.Reaction.Import.shop);
    // ensure Shops are loaded first.
    _api.Reaction.Import.flush(_collections.Shops);
  } catch (error) {
    _api.Logger.info("Bypassing loading Shop default data");
  }

  try {
    _import.Fixture.process(Assets.getText("data/Shipping.json"), ["name"], _api.Reaction.Import.shipping);
  } catch (error) {
    _api.Logger.info("Bypassing loading Shipping default data.");
  }

  try {
    _import.Fixture.process(Assets.getText("data/Products.json"), ["title"], _api.Reaction.Import.load);
  } catch (error) {
    _api.Logger.info("Bypassing loading Products default data.");
  }

  try {
    _import.Fixture.process(Assets.getText("data/Tags.json"), ["name"], _api.Reaction.Import.load);
  } catch (error) {
    _api.Logger.info("Bypassing loading Tags default data.");
  }
  //
  // these will flush and import with the rest of the imports from core init.
  // but Bulk.find.upsert() = false
  //
  _import.Fixture.flush();
};

var _collections = require("/lib/collections");

var _api = require("/server/api");

var _import = require("/server/api/core/import");