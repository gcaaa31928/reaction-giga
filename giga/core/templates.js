"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.html = html;

// Template literal for html strings.
function html(strings) {
  return strings.raw[0];
}