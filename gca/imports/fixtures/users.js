"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUser = getUser;
exports.getUsers = getUsers;

exports.default = function () {
  Factory.define("user", Meteor.users, user);
  Factory.define("registeredUser", Meteor.users, Object.assign({}, user, registered));

  Factory.define("anonymous", Meteor.users, Object.assign({}, user, anonymous));
};

var _faker = require("faker");

var _faker2 = _interopRequireDefault(_faker);

var _shops = require("./shops");

var _moment = require("moment");

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function getUser() {
  var existingUser = Meteor.users.findOne();
  return existingUser || Factory.create("user");
}

function getUsers() {
  var limit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;

  var users = [];
  var existingUsers = Meteor.users.find({}, { limit: limit }).fetch();
  for (var i = 0; i < limit; i = i + 1) {
    var _user = existingUsers[i] || Factory.create("user");
    users.push(_user);
  }
  return users;
}

/**
 * User Factory
 * @summary define user Factory
 */
var user = {
  username: function username() {
    return _faker2.default.internet.userName() + _.random(0, 1000);
  },

  name: function name() {
    return _faker2.default.name.findName();
  },

  emails: function emails() {
    var email = _faker2.default.internet.email();
    return [{
      address: email,
      verified: true
    }];
  },

  profile: function profile() {
    return {
      name: this.name,
      email: _faker2.default.internet.email(),
      profilePictureUrl: _faker2.default.image.imageUrl()
    };
  },

  gender: function gender() {
    return ["Either", "Male", "Female"][_.random(0, 2)];
  },

  description: function description() {
    return _faker2.default.lorem.paragraphs(3);
  },

  startTime: function startTime() {
    // needs moment.js package
    // some date within the next month
    return (0, _moment2.default)().add(_.random(0, 31), "days").add(_.random(0, 24), "hours").toDate();
  },

  createdAt: new Date()
};

var registered = {
  roles: _defineProperty({}, (0, _shops.getShop)()._id, ["account/profile", "guest", "product", "tag", "index", "cart/checkout", "cart/completed"]),
  services: {
    password: {
      bcrypt: Random.id(29)
    },
    resume: {
      loginTokens: [{
        when: (0, _moment2.default)().add(_.random(0, 31), "days").add(_.random(0, 24), "hours").toDate()
      }]
    }
  }
};

var anonymous = {
  roles: _defineProperty({}, (0, _shops.getShop)()._id, ["guest", "anonymous", "product", "tag", "index", "cart/checkout", "cart/completed"])
};