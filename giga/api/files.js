"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.copyFile = copyFile;
/*
 * Copy store data, copied from Meteor CollectionsFS
 * https://github.com/CollectionFS/Meteor-CollectionFS/blob/master/packages/file/fsFile-server.js#L225
 */
function _copyStoreData(fileObj, storeName, sourceKey, callback) {
  if (!fileObj.isMounted()) {
    throw new Error("Cannot copy store data for a file that is not associated with a collection");
  }

  var storage = fileObj.collection.storesLookup[storeName];
  if (!storage) {
    throw new Error(storeName + " is not a valid store name");
  }

  // We want to prevent beforeWrite and transformWrite from running, so
  // we interact directly with the store.
  var destinationKey = storage.adapter.fileKey(fileObj);
  var readStream = storage.adapter.createReadStreamForFileKey(sourceKey);
  var writeStream = storage.adapter.createWriteStreamForFileKey(destinationKey);

  writeStream.once("stored", function (result) {
    callback(null, result.fileKey);
  });

  writeStream.once("error", function (error) {
    callback(error);
  });

  readStream.pipe(writeStream);
}
var copyStoreData = Meteor.wrapAsync(_copyStoreData);

/*
 * Modified from Meteor CollectionsFS
 * https://github.com/CollectionFS/Meteor-CollectionFS/blob/master/packages/file/fsFile-server.js#L126
 */
function copyFile(fileObj, newMetaData) {
  var self = fileObj;

  if (!self.isMounted()) {
    throw new Error("Cannot copy a file that is not associated with a collection");
  }

  // Get the file record
  var fileRecord = self.collection.files.findOne({ _id: self._id }, { transform: null }) || {};

  if (newMetaData) {
    var oldMetaData = fileRecord.metadata || {};

    fileRecord.metadata = _extends({}, oldMetaData, newMetaData);
  }

  // Remove _id and copy keys from the file record
  delete fileRecord._id;

  // Insert directly; we don't have access to "original" in this case
  var newId = self.collection.files.direct.insert(fileRecord);

  var newFile = self.collection.findOne(newId);

  // Copy underlying files in the stores
  var mod = void 0;
  var oldKey = void 0;
  for (var name in newFile.copies) {
    if (newFile.copies.hasOwnProperty(name)) {
      oldKey = newFile.copies[name].key;
      if (oldKey) {
        // We need to ask the adapter for the true oldKey because
        // right now gridfs does some extra stuff.
        // TODO GridFS should probably set the full key object
        // (with _id and filename) into `copies.key`
        // so that copies.key can be passed directly to
        // createReadStreamForFileKey
        var sourceFileStorage = self.collection.storesLookup[name];
        if (!sourceFileStorage) {
          throw new Error(name + " is not a valid store name");
        }
        oldKey = sourceFileStorage.adapter.fileKey(self);
        // delete so that new fileKey will be generated in copyStoreData
        delete newFile.copies[name].key;
        mod = mod || {};
        mod["copies." + name + ".key"] = copyStoreData(newFile, name, oldKey);
      }
    }
  }
  // Update keys in the filerecord
  if (mod) {
    self.collection.files.direct.update({
      _id: newId
    }, {
      $set: mod
    });
  }

  return newFile;
}