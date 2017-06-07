"use strict";

var _api = require("/server/api");

require("../shop");

_api.MethodHooks.after("shop/createTag", function (options) {
  if (options.error) {
    _api.Logger.warn("Failed to add new tag:", options.error.reason);
    return options.error;
  }
  if (typeof options.result === "string") {
    _api.Logger.debug("Created tag with _id: " + options.result);
  }

  return options.result;
});
// this needed to keep correct loading order. Methods should be loaded before hooks