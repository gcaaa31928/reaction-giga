"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateMediaPriorities = exports.removeMedia = undefined;

var _collections = require("/lib/collections");

var _api = require("/server/api");

/**
 * removeMedia
 * @summary remove media from mongodb collection
 * @type {ValidatedMethod}
 * @param {String} mediaId - media _id
 * @return {Error|Undefined} object with error or nothing
 */
var removeMedia = exports.removeMedia = new ValidatedMethod({
  name: "removeMedia",
  validate: new SimpleSchema({
    mediaId: { type: String }
  }).validator(),
  run: function run(_ref) {
    var mediaId = _ref.mediaId;

    if (!_api.Reaction.hasPermission("createProduct")) {
      throw new Meteor.Error(403, "Access Denied");
    }
    return _collections.Media.remove({ _id: mediaId });
  }
});

/**
 * updateMediaPriorities
 * @summary sorting media by array indexes
 * @type {ValidatedMethod}
 * @param {Array} sortedMedias - array with images _ids
 * @return {Array} with results
 */
var updateMediaPriorities = exports.updateMediaPriorities = new ValidatedMethod({
  name: "updateMediaPriorities",
  validate: new SimpleSchema({
    sortedMedias: { type: [new SimpleSchema({ mediaId: { type: String } })] }
  }).validator(),
  run: function run(_ref2) {
    var sortedMedias = _ref2.sortedMedias;

    if (!_api.Reaction.hasPermission("createProduct")) {
      throw new Meteor.Error(403, "Access Denied");
    }
    var results = [];
    sortedMedias.forEach(function (image, index) {
      results.push(_collections.Media.update(image.mediaId, {
        $set: {
          "metadata.priority": index
        }
      }));
    });

    return results;
  }
});