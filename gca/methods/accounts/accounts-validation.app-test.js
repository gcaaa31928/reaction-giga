"use strict";

var _meteor = require("meteor/meteor");

var _practicalmeteorChai = require("meteor/practicalmeteor:chai");

// These are client-side only function (???) so they cannot be test from here
describe("Account Registration Validation ", function () {
  describe("username validation ", function () {
    it("should not allow a invalid username of length 3", function (done) {
      var username = "tn";
      _meteor.Meteor.call("accounts/validation/username", username, function (error, result) {
        (0, _practicalmeteorChai.expect)(error).to.be.undefined;
        (0, _practicalmeteorChai.expect)(result).to.be.an("object");
        return done();
      });
    });

    it("should allow a username of valid length", function (done) {
      var username = "tenten";
      _meteor.Meteor.call("accounts/validation/username", username, function (error, result) {
        (0, _practicalmeteorChai.expect)(error).to.be.undefined;
        (0, _practicalmeteorChai.expect)(result).to.be.true;
        return done();
      });
    });
  });

  describe("email address validation ", function () {
    it("should not allow an invalid email address", function (done) {
      this.timeout(4000);
      var email = "emailwebsite.com";
      _meteor.Meteor.call("accounts/validation/email", email, false, function (error, result) {
        (0, _practicalmeteorChai.expect)(result).to.be.an("object");
        return done();
      });
    });

    it("should allow a valid email address", function (done) {
      var email = "email@website.com";
      _meteor.Meteor.call("accounts/validation/email", email, false, function (error, result) {
        (0, _practicalmeteorChai.expect)(result).to.be.true;
        return done();
      });
    });

    it("should allow a blank optional email address", function (done) {
      var email = "";
      _meteor.Meteor.call("accounts/validation/email", email, true, function (error, result) {
        (0, _practicalmeteorChai.expect)(result).to.be.true;
        return done();
      });
    });

    it("should allow a valid, supplied, optional email address", function (done) {
      var email = "email@website.com";
      _meteor.Meteor.call("accounts/validation/email", email, true, function (error, result) {
        (0, _practicalmeteorChai.expect)(result).to.be.true;
        return done();
      });
    });

    it("should not allow an invalid, supplied, optional email address", function (done) {
      var email = "emailwebsite.com";
      _meteor.Meteor.call("accounts/validation/email", email, true, function (error, result) {
        (0, _practicalmeteorChai.expect)(result).to.be.an("object");
        return done();
      });
    });
  });

  describe("password validation", function () {
    it("should not allow a password under 6 characters in length", function (done) {
      var password = "abc12";
      _meteor.Meteor.call("accounts/validation/password", password, undefined, function (error, result) {
        (0, _practicalmeteorChai.expect)(result).to.be.an("array");
        var errMessage = result[0];
        (0, _practicalmeteorChai.expect)(errMessage).to.be.an("object");
        (0, _practicalmeteorChai.expect)(errMessage.reason).to.contain("at least 6 characters");
        return done();
      });
    });

    it("should allow a password of exactly 6 characters in length", function (done) {
      var password = "abc123";
      _meteor.Meteor.call("accounts/validation/password", password, undefined, function (error, result) {
        (0, _practicalmeteorChai.expect)(result).to.be.true;
        return done();
      });
    });

    it("should allow a password of 6 characters or more in length", function (done) {
      var password = "abc1234";
      _meteor.Meteor.call("accounts/validation/password", password, undefined, function (error, result) {
        (0, _practicalmeteorChai.expect)(result).to.be.true;
        return done();
      });
    });

    it("should allow a password of 6 characters or more in length with only uppercase characters", function (done) {
      var password = "ABC1234";
      _meteor.Meteor.call("accounts/validation/password", password, undefined, function (error, result) {
        (0, _practicalmeteorChai.expect)(result).to.be.true;
        return done();
      });
    });

    it("should allow a password of 6 characters or more in length uppercase and lower characters", function (done) {
      var password = "abcABC1234";
      _meteor.Meteor.call("accounts/validation/password", password, undefined, function (error, result) {
        (0, _practicalmeteorChai.expect)(result).to.be.true;
        return done();
      });
    });

    it("should allow a password of 6 characters or more in length uppercase, lower, and symbol characters", function (done) {
      var password = "abcABC1234@#$%^";
      _meteor.Meteor.call("accounts/validation/password", password, undefined, function (error, result) {
        (0, _practicalmeteorChai.expect)(result).to.be.true;
        return done();
      });
    });
  });
});