"use strict";

var _collections = require("/lib/collections");

var _api = require("/server/api");

var _revisions = require("/imports/plugins/core/revisions/lib/api/revisions");

/**
 * CollectionFS - Image/Video Publication
 * @params {Array} shops - array of current shop object
 */
Meteor.publish("Media", function (shops) {
  var _this = this;

  check(shops, Match.Optional(Array));
  var selector = void 0;
  var shopId = _api.Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }
  if (shopId) {
    selector = {
      "metadata.shopId": shopId
    };
  }
  if (shops) {
    selector = {
      "metadata.shopId": {
        $in: shops
      }
    };
  }

  // Product editors can see both published and unpublished images
  if (!_api.Reaction.hasPermission(["createProduct"], this.userId)) {
    selector["metadata.workflow"] = {
      $in: [null, "published"]
    };
  } else {
    // but no one gets to see archived images
    selector["metadata.workflow"] = {
      $nin: ["archived"]
    };
  }

  if (_revisions.RevisionApi.isRevisionControlEnabled()) {
    var revisionHandle = _collections.Revisions.find({
      "documentType": "image",
      "workflow.status": { $nin: ["revision/published"] }
    }).observe({
      added: function added(revision) {
        var media = _collections.Media.findOne(revision.documentId);
        if (media) {
          _this.added("Media", media._id, media);
          _this.added("Revisions", revision._id, revision);
        }
      },
      changed: function changed(revision) {
        var media = _collections.Media.findOne(revision.documentId);
        _this.changed("Media", media._id, media);
        _this.changed("Revisions", revision._id, revision);
      },
      removed: function removed(revision) {
        if (revision) {
          var media = _collections.Media.findOne(revision.documentId);
          if (media) {
            _this.removed("Media", media._id, media);
            _this.removed("Revisions", revision._id, revision);
          }
        }
      }
    });

    this.onStop(function () {
      revisionHandle.stop();
    });
  }

  return _collections.Media.find({
    "metadata.type": "brandAsset"
  });
});