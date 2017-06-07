"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Fixture = exports.Import = undefined;

var _mongo = require("meteor/mongo");

var _ejson = require("meteor/ejson");

var _collections = require("/lib/collections");

var Collections = _interopRequireWildcard(_collections);

var _hooks = require("../hooks");

var _hooks2 = _interopRequireDefault(_hooks);

var _logger = require("../logger");

var _logger2 = _interopRequireDefault(_logger);

var _rightJoin = require("./rightJoin");

var _rightJoin2 = _interopRequireDefault(_rightJoin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * @file Exposes the Import object implementing methods for bulk imports.
 * @author Tom De Caluwé
 */

var Import = exports.Import = {};

Import._buffers = {};
Import._contexts = {};
Import._count = {};
Import._indications = {};
Import._limit = 1000;

Import._name = function (collection) {
  return collection._name;
};

Import._upsert = function () {
  return true;
};

//
// TODO Verify if Import.startup is deprecated
//
Import.startup = function () {
  return true;
};

Import.load = function (key, object) {
  check(object, Object);

  this.object(this.identify(object), key, object);
};

Import.indication = function (field, collection, probability) {
  check(field, String);
  check(collection, _mongo.Mongo.Collection);
  check(probability, Number);

  this._indications[field] = { collection: collection, probability: probability };
};

/**
 * Import.identify
 * @summary Tries to identify the schema associated with a document.
 * @param {Object} document - A document with unknown schema
 * @returns {Mongo.Collection} Returns a MongoDB collection in which the
 * document can be inserted.
 * @throws {Error} Throws an error if the schema couldn't be determined.
 *
 * The algorithm initially assumes the document can be anything. It associates
 * with each field in the document a probability that it isn't following some
 * schema other than the one the field is associated with.
 *
 * Afterwards the schema with the maximal probability is selected. An error is
 * thrown if the schema cannot be determined.
 */
Import.identify = function (document) {
  check(document, Object);

  var probabilities = {};

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.keys(document)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      key = _step.value;

      if (this._indications[key]) {
        var collection = this._name(this._indications[key].collection);
        probabilities[collection] = probabilities[collection] || 1.0 * this._indications[key].probability;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var total = 1.0;
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = Object.keys(probabilities)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      key = _step2.value;

      total *= probabilities[key];
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  var max = 0.0;
  var name = void 0;
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = Object.keys(probabilities)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      key = _step3.value;

      var probability = total / probabilities[key];
      if (probability > max) {
        max = probability;
        name = key;
      } else if (probability === max) {
        name = undefined;
      }
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  if (name && max > 0.3) {
    return Collections[name];
  }
  throw new Error("Couldn't determine the schema associated with this document");
};

/**
 * @summary Commit the buffer for a given collection to the database.
 * @param {Mongo.Collection} collection The target collection to be flushed to disk
 * @returns {undefined}
 */
Import.commit = function (collection) {
  check(collection, _mongo.Mongo.Collection);
  // Construct a collection identifier.
  var name = this._name(collection);

  // Only commit if the buffer isn't empty (otherwise it'll throw).
  if (this._count[name]) {
    this.buffer(collection).execute(function (error, result) {
      // Inserted document counts don't affect the modified document count, so we
      // throw everything together.
      var nImported = result.nModified + result.nInserted + result.nUpserted;
      var nTouched = result.nMatched + result.nInserted + result.nUpserted;
      var nRemoved = result.nRemoved;
      // Log some information about the import.
      if (nTouched) {
        var _message = "Modified " + nImported + (nImported === 1 ? " document" : " documents");
        _message += " while importing " + nTouched + " to " + name;
        _logger2.default.debug(_message);
      }
      if (nRemoved) {
        var _message2 = "Removed " + nRemoved + (nRemoved === 1 ? " document" : " documents");
        _message2 += " from " + name;
        _logger2.default.debug(_message2);
      }
      // Log any errors returned.
      var message = "Error while importing to " + name;
      var writeErrors = result.getWriteErrors();
      for (var i = 0; i < writeErrors.length; i++) {
        _logger2.default.warn(message + ": " + writeErrors[i].errmsg);
      }
      var writeConcernError = result.getWriteConcernError();
      if (writeConcernError) {
        _logger2.default.warn(message + ": " + writeConcernError.errmsg);
      }
    });
    // Reset the buffer.
    delete this._buffers[name];
    this._count[name] = 0;
  }
};

/**
 * @summary Process the buffer for a given collection and commit the database.
 * @param {Mongo.Collection} collection optional - supply a Mongo collection, or leave empty to commit all buffer entries
 * @returns {undefined}
 */
Import.flush = function (collection) {
  if (!collection) {
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = Object.keys(this._buffers)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var name = _step4.value;

        this.commit(Collections[name]);
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }

    return;
  }
  this.commit(collection);
};

/**
 * @summary Get a validation context for a given collection.
 * @param {Mongo.Collection} collection The target collection
 * @param {Object} [selector] A selector object to retrieve the correct schema.
 * @returns {SimpleSchemaValidationContext} A validation context.
 *
 * The validation context is requested from the schema associated with the
 * collection.
 */
Import.context = function (collection, selector) {
  check(collection, _mongo.Mongo.Collection);
  check(selector, Match.Optional(Object));

  // Construct a context identifier.
  var name = this._name(collection);
  if (selector && selector.type) {
    name = name + "_" + selector.type;
  }
  // Construct a new validation context if necessary.
  if (this._contexts[name]) {
    return this._contexts[name];
  }
  this._contexts[name] = collection.simpleSchema(selector).newContext();
  return this._contexts[name];
};

/**
 * @summary Get an import buffer for a given collection.
 * @param {Object} collection The target collection
 * @returns {Object} return buffer
 * If no buffer is presented, a new one will be constructed.
 */
Import.buffer = function (collection) {
  check(collection, _mongo.Mongo.Collection);

  if (!MongoInternals.NpmModule.Collection.prototype.initializeUnorderedBulkOp) {
    throw Error("Couldn't detect the MongoDB bulk API, are you using MongoDB 2.6 or above?");
  }

  // Construct a buffer identifier.
  var name = this._name(collection);

  // Construct a new buffer if necessary.
  if (this._buffers[name]) {
    return this._buffers[name];
  }
  this._count[name] = 0;
  this._buffers[name] = collection.rawCollection().initializeUnorderedBulkOp();
  return this._buffers[name];
};

/**
 * @summary Store a product in the import buffer.
 * @param {Object} key A key to look up the product
 * @param {Object} product The product data to be updated
 * @param {Object} parent A key to identify the parent product
 * @returns {Object}
 * Importing a variant currently consists of the following steps:
 *
 * * Pull the variant from non-matching parent products.
 * * Push the variant if it doesn't exist.
 * * Update the variant.
 */
Import.product = function (key, product, parent) {
  check(parent, Object);

  return this.object(Collections.Products, key, product);
};

/**
 * @summary Store a package in the import buffer.
 * @param {Object} pkg The package data to be updated
 * @param {String} shopId The package data to be updated
 * @returns {undefined}
 */
Import.package = function (pkg, shopId) {
  check(pkg, Object);
  check(shopId, String);
  var key = {
    name: pkg.name,
    shopId: shopId
  };
  return this.object(Collections.Packages, key, pkg);
};

//
// Import.translation
// server/startup/i18n.js
//

/**
 * @summary Store a template in the import buffer.
 * @param {Object} templateInfo The template data to be updated
 * @param {String} shopId The package data to be updated
 * @returns {undefined}
 */
Import.template = function (templateInfo) {
  check(templateInfo, Object);

  var key = {
    name: templateInfo.name,
    type: templateInfo.type || "template"
  };

  return this.object(Collections.Templates, key, templateInfo);
};

/**
 * @summary Store a translation in the import buffer.
 * @param {Object} key A key to look up the translation
 * @param {Object} translation The translation data to be updated
 * @returns {Object} updated translation buffer
 */
Import.translation = function (key, translation) {
  var modifiedKey = Object.assign(key, { ns: translation.ns });
  return this.object(Collections.Translations, modifiedKey, translation);
};

/**
 * @summary Store a shop in the import buffer.
 * @param {Object} key A key to look up the shop
 * @param {Object} shop The shop data to be updated
 * @returns {Object} this shop
 */
Import.shop = function (key, shop) {
  return this.object(Collections.Shops, key, shop);
};

/**
 * @summary store a shop layout in the import buffer
 * @param {Array} layout - an array of layouts to be added to shop
 * @param {String} shopId shopId
 * @returns {Object} this shop
 */
Import.layout = function (layout, shopId) {
  var key = {
    _id: shopId
  };
  return this.object(Collections.Shops, key, {
    _id: shopId,
    layout: layout
  });
};

/**
 * @summary Store shipping in the import buffer.
 * @param {Object} key A shipping service key used in combination with provider
 * @param {Object} shipping The shipping data to be updated
 * @returns {Object} this shipping
 */
Import.shipping = function (key, shipping) {
  var importKey = {};
  //
  // we have a bit of a strange structure in Shipping
  // and don't really have a key that is good for
  // determining if we imported this before
  // so we're just saying that if this service
  // already exists then we're not going to import
  //
  var result = Collections.Shipping.findOne(key);
  if (result) {
    importKey = {
      _id: result._id,
      shopId: result.shopId
    };
    delete shipping.methods;
  }
  var modifiedKey = Object.assign({}, key, importKey);
  return this.object(Collections.Shipping, modifiedKey, shipping);
};

/**
 * @summary Store a tag in the import buffer.
 * @param {Object} key A key to look up the tag
 * @param {Object} tag The tag data to be updated
 * @returns {Object} this tag
 */
Import.tag = function (key, tag) {
  return this.object(Collections.Tags, key, tag);
};

/**
 * @summary Push a new upsert document to the import buffer.
 * @param {Mongo.Collection} collection The target collection
 * @param {Object} key A key to look up the object
 * @param {Object} object The object data to be updated
 * @returns {undefined}
 */
Import.object = function (collection, key, object) {
  check(collection, _mongo.Mongo.Collection);
  check(key, Object);
  check(object, Object);
  var updateObject = object;

  // enforce strings instead of Mongo.ObjectId
  if (!collection.findOne(key) && !object._id) key._id = Random.id();

  // hooks for additional import manipulation.
  var importObject = _hooks2.default.Events.run("onImport" + this._name(collection), object);

  // Clone object for cleaning
  var cleanedObject = Object.assign({}, importObject);

  // Cleaning the object adds default values from schema, if value doesn't exist
  collection.simpleSchema(importObject).clean(cleanedObject);

  // And validate the object against the schema
  this.context(collection, updateObject).validate(cleanedObject, {});

  // Disjoint importObject and cleanedObject again
  // to prevent `Cannot update '<field>' and '<field>' at the same time` errors
  var defaultValuesObject = (0, _rightJoin2.default)(importObject, cleanedObject);

  // Upsert the object.
  var find = this.buffer(collection).find(key);

  // With the upsert option set to true, if no matching documents exist for the Bulk.find() condition,
  // then the update or the replacement operation performs an insert.
  // https://docs.mongodb.com/manual/reference/method/Bulk.find.upsert/
  if (Object.keys(defaultValuesObject).length === 0) {
    find.upsert().update({
      $set: importObject
    });
  } else {
    find.upsert().update({
      $set: importObject,
      $setOnInsert: defaultValuesObject
    });
  }
  if (this._count[this._name(collection)]++ >= this._limit) {
    this.flush(collection);
  }
};

/**
 * @summary Process a json array of import documents using a callback.
 * @param {Object[]} json An array containing the import documents
 * @param {string[]} keys Fields that should be used as the import key.
 * @param {Function} callback A callback accepting two parameters.
 * The callback should accept a key document to consult the database as a first
 * parameter and an update document as the second parameter.
 * @returns {undefined}
 */
Import.process = function (json, keys, callback) {
  check(json, String);
  check(keys, Array);
  check(callback, Function);

  var array = _ejson.EJSON.parse(json);

  for (var i = 0; i < array.length; i++) {
    var _key = {};
    for (var j = 0; j < keys.length; j++) {
      _key[keys[j]] = array[i][keys[j]];
    }
    callback.call(this, _key, array[i]);
  }
};

Import.indication("i18n", Collections.Translations, 0.2);
Import.indication("hashtags", Collections.Products, 0.5);
Import.indication("barcode", Collections.Products, 0.5);
Import.indication("price", Collections.Products, 0.5);
Import.indication("ancestors", Collections.Products, 0.5);
Import.indication("languages", Collections.Shops, 0.5);
Import.indication("currencies", Collections.Shops, 0.5);
Import.indication("timezone", Collections.Shops, 0.5);
Import.indication("isTopLevel", Collections.Tags, 0.4);
Import.indication("slug", Collections.Tags, 0.5);
Import.indication("provider", Collections.Shipping, 0.2);

//
// exporting Fixture
// use this instead of Import if you want
// Bulk.find.upsert() to equal false
//
var Fixture = exports.Fixture = Object.assign({}, Import, {
  _upsert: function _upsert() {
    return false;
  }
});