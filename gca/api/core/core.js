"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _uniqWith2 = require("lodash/uniqWith");

var _uniqWith3 = _interopRequireDefault(_uniqWith2);

var _merge2 = require("lodash/merge");

var _merge3 = _interopRequireDefault(_merge2);

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _package = require("/package.json");

var _package2 = _interopRequireDefault(_package);

var _meteor = require("meteor/meteor");

var _ejson = require("meteor/ejson");

var _collections = require("/lib/collections");

var _api = require("/server/api");

var _jobs = require("/server/jobs");

var _jobs2 = _interopRequireDefault(_jobs);

var _setDomain = require("./setDomain");

var _templates = require("./templates");

var _accounts = require("./accounts");

var _config = require("./email/config");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  init: function init() {
    // make sure the default shop has been created before going further
    while (!this.getShopId()) {
      _api.Logger.warn("No shopId, waiting one second...");
      _meteor.Meteor._sleepForMs(1000);
    }

    // run onCoreInit hooks
    _api.Hooks.Events.run("onCoreInit");

    // start job server
    _collections.Jobs.startJobServer(function () {
      _api.Logger.info("JobServer started");
      (0, _jobs2.default)();
      _api.Hooks.Events.run("onJobServerStart");
    });
    if (process.env.VERBOSE_JOBS) {
      _collections.Jobs.setLogStream(process.stdout);
    }

    this.loadPackages();
    // process imports from packages and any hooked imports
    this.Import.flush();
    // timing is important, packages are rqd for initial permissions configuration.
    if (!_meteor.Meteor.isAppTest) {
      this.createDefaultAdminUser();
    }
    this.setAppVersion();
    // hook after init finished
    _api.Hooks.Events.run("afterCoreInit");

    _api.Logger.debug("Reaction.init() has run");

    return true;
  },


  Packages: {},

  registerPackage: function registerPackage(packageInfo) {
    var registeredPackage = this.Packages[packageInfo.name] = packageInfo;
    return registeredPackage;
  },


  /**
   * registerTemplate
   * registers Templates into the Tempaltes Collection
   * @return {function} Registers template
   */
  registerTemplate: _templates.registerTemplate,

  /**
   * hasPermission - server
   * server permissions checks
   * hasPermission exists on both the server and the client.
   * @param {String | Array} checkPermissions -String or Array of permissions if empty, defaults to "admin, owner"
   * @param {String} userId - userId, defaults to Meteor.userId()
   * @param {String} checkGroup group - default to shopId
   * @return {Boolean} Boolean - true if has permission
   */
  hasPermission: function hasPermission(checkPermissions) {
    var userId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _meteor.Meteor.userId();
    var checkGroup = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.getShopId();

    // check(checkPermissions, Match.OneOf(String, Array)); check(userId, String); check(checkGroup,
    // Match.Optional(String));

    var permissions = void 0;
    // default group to the shop or global if shop isn't defined for some reason.
    if (checkGroup !== undefined && typeof checkGroup === "string") {
      group = checkGroup;
    } else {
      group = this.getShopId() || Roles.GLOBAL_GROUP;
    }

    // permissions can be either a string or an array we'll force it into an array and use that
    if (checkPermissions === undefined) {
      permissions = ["owner"];
    } else if (typeof checkPermissions === "string") {
      permissions = [checkPermissions];
    } else {
      permissions = checkPermissions;
    }

    // if the user has admin, owner permissions we'll always check if those roles are enough
    permissions.push("owner");
    permissions = _.uniq(permissions);

    // return if user has permissions in the group
    if (Roles.userIsInRole(userId, permissions, group)) {
      return true;
    }

    // global roles check
    var sellerShopPermissions = Roles.getGroupsForUser(userId, "admin");

    // we're looking for seller permissions.
    if (sellerShopPermissions) {
      // loop through shops roles and check permissions
      for (var key in sellerShopPermissions) {
        if (key) {
          var shop = sellerShopPermissions[key];
          if (Roles.userIsInRole(userId, permissions, shop)) {
            return true;
          }
        }
      }
    }
    // no specific permissions found returning false
    return false;
  },
  hasOwnerAccess: function hasOwnerAccess() {
    return this.hasPermission(["owner"]);
  },
  hasAdminAccess: function hasAdminAccess() {
    return this.hasPermission(["owner", "admin"]);
  },
  hasDashboardAccess: function hasDashboardAccess() {
    return this.hasPermission(["owner", "admin", "dashboard"]);
  },
  getSellerShopId: function getSellerShopId() {
    return Roles.getGroupsForUser(this.userId, "admin");
  },
  configureMailUrl: function configureMailUrl() {
    // maintained for legacy support
    _api.Logger.warn("Reaction.configureMailUrl() is deprecated. Please use Reaction.Email.getMailUrl() instead");
    return (0, _config.getMailUrl)();
  },
  getCurrentShopCursor: function getCurrentShopCursor() {
    var domain = this.getDomain();
    var cursor = _collections.Shops.find({
      domains: domain
    }, { limit: 1 });
    if (!cursor.count()) {
      _api.Logger.debug(domain, "Add a domain entry to shops for ");
    }
    return cursor;
  },
  getCurrentShop: function getCurrentShop() {
    var currentShopCursor = this.getCurrentShopCursor();
    // also, we could check in such a way: `currentShopCursor instanceof Object` but not instanceof something.Cursor
    if ((typeof currentShopCursor === "undefined" ? "undefined" : _typeof(currentShopCursor)) === "object") {
      return currentShopCursor.fetch()[0];
    }
    return null;
  },
  getShopId: function getShopId() {
    var domain = this.getDomain();
    var shop = _collections.Shops.find({
      domains: domain
    }, {
      limit: 1,
      fields: {
        _id: 1
      }
    }).fetch()[0];
    return shop && shop._id;
  },
  getDomain: function getDomain() {
    return _url2.default.parse(_meteor.Meteor.absoluteUrl()).hostname;
  },
  getShopName: function getShopName() {
    var domain = this.getDomain();
    var shop = _collections.Shops.find({
      domains: domain
    }, {
      limit: 1,
      fields: {
        name: 1
      }
    }).fetch()[0];
    return shop && shop.name;
  },
  getShopPrefix: function getShopPrefix() {
    return "/" + this.getSlug(this.getShopName().toLowerCase());
  },
  getShopEmail: function getShopEmail() {
    var shop = _collections.Shops.find({
      _id: this.getShopId()
    }, {
      limit: 1,
      fields: {
        emails: 1
      }
    }).fetch()[0];
    return shop && shop.emails && shop.emails[0].address;
  },
  getShopSettings: function getShopSettings() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "core";

    var settings = _collections.Packages.findOne({ name: name, shopId: this.getShopId() }) || {};
    return settings.settings || {};
  },
  getShopCurrency: function getShopCurrency() {
    var shop = _collections.Shops.findOne({
      _id: this.getShopId()
    });

    return shop && shop.currency || "USD";
  },
  getShopLanguage: function getShopLanguage() {
    var _Shops$findOne = _collections.Shops.findOne({
      _id: this.getShopId()
    }, {
      fields: {
        language: 1
      } }),
        language = _Shops$findOne.language;

    return language;
  },
  getPackageSettings: function getPackageSettings(name) {
    return _collections.Packages.findOne({ packageName: name, shopId: this.getShopId() }) || null;
  },
  getAppVersion: function getAppVersion() {
    return _collections.Shops.findOne().appVersion;
  },


  /**
   * createDefaultAdminUser
   * @summary Method that creates default admin user
   * Settings load precendence:
   *  1. settings in meteor.settings
   *  2. environment variables
   * @returns {String} return userId
   */
  createDefaultAdminUser: function createDefaultAdminUser() {
    var domain = (0, _setDomain.getRegistryDomain)();
    var env = process.env;
    var defaultAdminRoles = ["owner", "admin", "guest", "account/profile"];
    var options = {};
    var configureEnv = false;
    var accountId = void 0;

    var shopId = this.getShopId();

    // if an admin user has already been created, we'll exit
    if (Roles.getUsersInRole("owner", shopId).count() !== 0) {
      _api.Logger.debug("Not creating default admin user, already exists");
      return ""; // this default admin has already been created for this shop.
    }

    // run hooks on options object before creating user (the options object must be returned from all callbacks)
    options = _api.Hooks.Events.run("beforeCreateDefaultAdminUser", options);

    //
    // process Meteor settings and env variables for initial user config if ENV variables are set, these always override
    // "settings.json" this is to allow for testing environments. where we don't want to use users configured in a settings
    // file.
    //
    if (env.REACTION_EMAIL && env.REACTION_USER && env.REACTION_AUTH) {
      configureEnv = true;
    }

    // defaults use either env or generated
    options.email = env.REACTION_EMAIL || Random.id(8).toLowerCase() + "@" + domain;
    options.username = env.REACTION_USER || "Admin"; // username
    options.password = env.REACTION_AUTH || Random.secret(8);

    // but we can override with provided `meteor --settings`
    if (_meteor.Meteor.settings && !configureEnv) {
      if (_meteor.Meteor.settings.reaction) {
        options.username = _meteor.Meteor.settings.reaction.REACTION_USER || "Admin";
        options.password = _meteor.Meteor.settings.reaction.REACTION_AUTH || Random.secret(8);
        options.email = _meteor.Meteor.settings.reaction.REACTION_EMAIL || Random.id(8).toLowerCase() + "@" + domain;
        _api.Logger.info("Using meteor --settings to create admin user");
      }
    }

    // set the default shop email to the default admin email
    _collections.Shops.update(shopId, {
      $addToSet: {
        emails: {
          address: options.email,
          verified: true
        },
        domains: _meteor.Meteor.settings.ROOT_URL
      }
    });

    //
    // create the new admin user
    //

    // we're checking again to see if this user was created but not specifically for this shop.
    if (_meteor.Meteor.users.find({ "emails.address": options.email }).count() === 0) {
      accountId = Accounts.createUser(options);
    } else {
      // this should only occur when existing admin creates a new shop
      accountId = _meteor.Meteor.users.findOne({ "emails.address": options.email })._id;
    }

    //
    // send verification email
    //

    // we dont need to validate admin user in development
    if (process.env.NODE_ENV === "development") {
      _meteor.Meteor.users.update({
        "_id": accountId,
        "emails.address": options.email
      }, {
        $set: {
          "emails.$.verified": true
        }
      });
    } else {
      // send verification email to admin
      (0, _accounts.sendVerificationEmail)(accountId);
    }

    //
    // Set Default Roles
    //

    // we don't use accounts/addUserPermissions here because we may not yet have permissions
    Roles.setUserRoles(accountId, _.uniq(defaultAdminRoles), shopId);
    // // the reaction owner has permissions to all sites by default
    Roles.setUserRoles(accountId, _.uniq(defaultAdminRoles), Roles.GLOBAL_GROUP);
    // initialize package permissions we don't need to do any further permission configuration it is taken care of in the
    // assignOwnerRoles
    var packages = _collections.Packages.find().fetch();
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = packages[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var pkg = _step.value;

        this.assignOwnerRoles(shopId, pkg.name, pkg.registry);
      }

      //
      //  notify user that admin was created account email should print on console
      //
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

    _api.Logger.warn("\n *********************************\n        \n  IMPORTANT! DEFAULT ADMIN INFO\n        \n  EMAIL/LOGIN: " + options.email + "\n        \n  PASSWORD: " + options.password + "\n        \n ********************************* \n\n");

    // run hooks on new user object
    var user = _meteor.Meteor.users.findOne(accountId);
    _api.Hooks.Events.run("afterCreateDefaultAdminUser", user);
    return accountId;
  },


  /**
   *  loadPackages
   *  insert Reaction packages into registry
   *  we check to see if the number of packages have changed against current data
   *  if there is a change, we'll either insert or upsert package registry
   *  into the Packages collection
   *  import is processed on hook in init()
   *  @return {String} returns insert result
   */
  loadPackages: function loadPackages() {
    var _this = this;

    var packages = _collections.Packages.find().fetch();

    var registryFixtureData = void 0;

    if (process.env.REACTION_REGISTRY) {
      // check the environment for the registry fixture data first
      registryFixtureData = process.env.REACTION_REGISTRY;
      _api.Logger.info("Loaded REACTION_REGISTRY environment variable for registry fixture import");
    } else {
      // or attempt to load reaction.json fixture data
      try {
        registryFixtureData = Assets.getText("settings/reaction.json");
        _api.Logger.info("Loaded \"/private/settings/reaction.json\" for registry fixture import");
      } catch (error) {
        _api.Logger.warn("Skipped loading settings from reaction.json.");
        _api.Logger.debug(error, "loadSettings reaction.json not loaded.");
      }
    }

    if (!!registryFixtureData) {
      var validatedJson = _ejson.EJSON.parse(registryFixtureData);

      if (!Array.isArray(validatedJson[0])) {
        _api.Logger.warn("Registry fixture data is not an array. Failed to load.");
      } else {
        registryFixtureData = validatedJson;
      }
    }

    var layouts = [];
    // for each shop, we're loading packages in a unique registry
    _.each(this.Packages, function (config, pkgName) {
      return _collections.Shops.find().forEach(function (shop) {
        var shopId = shop._id;
        if (!shopId) return [];

        // existing registry will be upserted with changes, perhaps we should add:
        _this.assignOwnerRoles(shopId, pkgName, config.registry);

        // Settings from the package registry.js
        var settingsFromPackage = {
          name: pkgName,
          icon: config.icon,
          enabled: !!config.autoEnable,
          settings: config.settings,
          registry: config.registry,
          layout: config.layout
        };

        // Setting from a fixture file, most likely reaction.json
        var settingsFromFixture = void 0;
        if (registryFixtureData) {
          settingsFromFixture = _.find(registryFixtureData[0], function (packageSetting) {
            return config.name === packageSetting.name;
          });
        }

        // Setting already imported into the packages collection
        var settingsFromDB = _.find(packages, function (ps) {
          return config.name === ps.name && shopId === ps.shopId;
        });

        var combinedSettings = (0, _merge3.default)({}, settingsFromPackage, settingsFromFixture || {}, settingsFromDB || {});

        // populate array of layouts that don't already exist in Shops
        if (combinedSettings.layout) {
          // filter out layout Templates
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = combinedSettings.layout[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var pkg = _step2.value;

              if (pkg.layout) {
                layouts.push(pkg);
              }
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
        }
        // Import package data
        _this.Import.package(combinedSettings, shopId);
        return _api.Logger.debug("Initializing " + shop.name + " " + pkgName);
      }); // end shops
    });

    // helper for removing layout duplicates
    var uniqLayouts = (0, _uniqWith3.default)(layouts, _.isEqual);
    // import layouts into Shops
    _collections.Shops.find().forEach(function (shop) {
      _this.Import.layout(uniqLayouts, shop._id);
    });

    //
    // package cleanup
    //
    _collections.Shops.find().forEach(function (shop) {
      return _collections.Packages.find().forEach(function (pkg) {
        // delete registry entries for packages that have been removed
        if (!_.has(_this.Packages, pkg.name)) {
          _api.Logger.debug("Removing " + pkg.name);
          return _collections.Packages.remove({ shopId: shop._id, name: pkg.name });
        }
        return false;
      });
    });
  },
  setAppVersion: function setAppVersion() {
    var version = _package2.default.version;
    _api.Logger.info("Reaction Version: " + version);
    _collections.Shops.update({}, { $set: { appVersion: version } }, { multi: true });
  }
};