"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSlug = getSlug;

var _transliteration = require("transliteration");

/**
 * getSlug - return a slugified string using "slugify" from transliteration
 * https://www.npmjs.com/package/transliteration
 * @param  {String} slugString - string to slugify
 * @return {String} slugified string
 */
function getSlug(slugString) {
  return slugString ? (0, _transliteration.slugify)(slugString) : "";
}