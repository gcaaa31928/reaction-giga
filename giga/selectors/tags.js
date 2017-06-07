"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var getTagIds = exports.getTagIds = function getTagIds(state) {
  if (Array.isArray(state.tags)) {
    return state.tags.map(function (tag) {
      return tag._id;
    });
  }

  return [];
};