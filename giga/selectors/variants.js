"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var getVariantIds = exports.getVariantIds = function getVariantIds(variants) {
  return Array.isArray(variants) && variants.map(function (variant) {
    return variant._id;
  });
};