"use strict";

var _meteor = require("meteor/meteor");

var validationMethods = {
  /**
   * Username validation
   * @summary Determins if a username meets the minimum requirement of 3 characters
   * @param  {String} username Username to validate
   * @return {Boolean|Object} true if valid, error object if invalid
   */
  username: function username(_username) {
    check(_username, Match.OptionalOrNull(String));

    // Valid
    if (_username.length >= 3) {
      return true;
    }

    // Invalid
    return {
      error: "INVALID_USERNAME",
      reason: "Username must be at least 3 characters long",
      i18nKeyReason: "accountsUI.error.usernameMinLength"
    };
  },


  /**
   * Email validation
   * @summary Validates both required and optional email addresses.
   * @param  {String} email Email address to validate
   * @param  {Boolean} optional If set to true, validation will pass if email is blank
   * @return {Boolean|Object} Returns true if valid; Returns an error object if invalid
   */
  email: function email(_email, optional) {
    check(_email, Match.OptionalOrNull(String));
    check(optional, Match.OptionalOrNull(Boolean));

    var processedEmail = _email.trim();

    // Valid
    if (optional === true && processedEmail.length === 0) {
      return true;
    } else if (processedEmail.indexOf("@") !== -1) {
      return true;
    }

    // Invalid
    return {
      error: "INVALID_EMAIL",
      reason: "Email address is invalid",
      i18nKeyReason: "accountsUI.error.invalidEmail"
    };
  },


  /**
   * Password validation
   * Passwords may be validated 2 ways.
   * "exists" (options.validationLevel = "exists") - Password must not be blank. Thats is the only rule. Used to validate a sign in.
   * undefined (options.validationLevel = undefined) - Password must meet the lenght and other criteria to validate. Used for validating a new sign up.
   * @param  {String} password Password to validate
   * @param  {Object} options Options to apply to the password validator
   * @param  {String} options.validationLevel "exists" | undefined (default)
   * @return {Boolean|[{error: String, reason: String}]} true if valid | Error object otherwise
   */
  password: function password(_password, options) {
    check(_password, Match.OptionalOrNull(String));
    check(options, Match.OptionalOrNull(Object));

    var passwordOptions = options || {};
    var errors = [];

    // Only check if a password has been entered at all.
    // This is usefull for the login forms
    if (passwordOptions.validationLevel === "exists") {
      if (_password.length > 0) {
        return true;
      }

      errors.push({
        error: "INVALID_PASSWORD",
        reason: "Password is required",
        i18nKeyReason: "accountsUI.error.passwordRequired"
      });
    } else {
      // Validate the password on some rules
      // This is useful for cases where a password needs to be created or updated.
      if (_password.length < 6) {
        errors.push({
          error: "INVALID_PASSWORD",
          reason: "Password must be at least 6 characters long.",
          i18nKeyReason: "accountsUI.error.passwordMustBeAtLeast6CharactersLong"
        });
      }
    }

    if (errors.length) {
      return errors;
    }

    // Otherwise the password is valid
    return true;
  }
};

// Export object globally
LoginFormValidation = validationMethods;

// Register validation methods as meteor methods
_meteor.Meteor.methods({
  "accounts/validation/username": validationMethods.username,
  "accounts/validation/email": validationMethods.email,
  "accounts/validation/password": validationMethods.password
});