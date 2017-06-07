"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRegistryDomain = getRegistryDomain;
exports.setDomain = setDomain;

var _collections = require("/lib/collections");

var _api = require("/server/api");

/**
 * getDomain
 * local helper for creating admin users
 * @param {String} requestUrl - url
 * @return {String} domain name stripped from requestUrl
 */
function getRegistryDomain(requestUrl) {
  var url = requestUrl || process.env.ROOT_URL;
  var domain = url.match(/^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i)[1];
  return domain;
}

/**
 *  @private setDomain
 *  @summary update the default shop url if ROOT_URL supplied is different from current
 *  @return {String} returns insert result
 */
function setDomain() {
  var currentDomain = void 0;
  // we automatically update the shop domain when ROOT_URL changes
  try {
    currentDomain = _collections.Shops.findOne().domains[0];
  } catch (_error) {
    _api.Logger.error(_error, "Failed to determine default shop.");
  }
  // if the server domain changes, update shop
  var domain = getRegistryDomain();
  if (currentDomain && currentDomain !== domain) {
    _api.Logger.debug("Updating domain to " + domain);
    _collections.Shops.update({
      domains: currentDomain
    }, {
      $set: {
        "domains.$": domain
      }
    });
  }
}