"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.send = send;
exports.getSubject = getSubject;
exports.getTemplate = getTemplate;
exports.getTemplateFile = getTemplateFile;

var _meteor = require("meteor/meteor");

var _vsivsiJobCollection = require("meteor/vsivsi:job-collection");

var _collections = require("/lib/collections");

var _api = require("/server/api");

/**
 * Reaction.Email.send()
 * (Job API doc) https://github.com/vsivsi/meteor-job-collection/#user-content-job-api
 * @param  {Object} options - object containing to/from/subject/html String keys
 * @return {Boolean} returns job object
 */
function send(options) {
  return new _vsivsiJobCollection.Job(_collections.Jobs, "sendEmail", options).retry({
    retries: 5,
    wait: 3 * 60000
  }).save();
}

/**
 * Reaction.Email.getSubject() - Returns a subject source for SSR consumption
 * layout must be defined + template
 * @param {String} template name of the template in either Layouts or fs
 * @returns {Object} returns source
 */
function getSubject(template) {
  if (typeof template !== "string") {
    var msg = "Reaction.Email.getSubject() requires a template name";
    _api.Logger.error(msg);
    throw new _meteor.Meteor.Error("no-template-name", msg);
  }

  // set default
  var language = _api.Reaction.getShopLanguage();

  // check database for a matching template
  var tmpl = _collections.Templates.findOne({
    name: template,
    language: language
  });

  // use that template if found
  if (tmpl && tmpl.template) {
    return tmpl.subject;
  }
  return "A message from {{shop.name}}";
}

/**
 * Reaction.Email.getTemplate() - Returns a template source for SSR consumption
 * layout must be defined + template
 * @param {String} template name of the template in either Layouts or fs
 * @returns {Object} returns source
 */
function getTemplate(template) {
  if (typeof template !== "string") {
    var msg = "Reaction.Email.getTemplate() requires a template name";
    _api.Logger.error(msg);
    throw new _meteor.Meteor.Error("no-template-name", msg);
  }

  // set default
  var language = _api.Reaction.getShopLanguage();

  // check database for a matching template
  var tmpl = _collections.Templates.findOne({
    name: template,
    language: language
  });

  // use that template if found
  if (tmpl && tmpl.template) {
    return tmpl.template;
  }

  // otherwise, use the default template from the filesystem
  return getTemplateFile(template);
}

/**
 * Reaction.Email.getTemplateFile
 * @param  {String} file name of the template on file system
 * @return {String} returns source
 */
function getTemplateFile(file) {
  if (typeof file !== "string") {
    var msg = "Reaction.Email.getTemplateFile() requires a template name";
    _api.Logger.error(msg);
    throw new _meteor.Meteor.Error("no-template-name", msg);
  }

  try {
    return Assets.getText("email/templates/" + file + ".html");
  } catch (e) {
    _api.Logger.warn("Template not found: " + file + ". Falling back to coreDefault.html");
    return Assets.getText("email/templates/coreDefault.html");
  }
}