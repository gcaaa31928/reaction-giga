"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TEMPLATE_PARSER_HANDLEBARS = exports.TEMPLATE_PARSER_REACT = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.registerTemplate = registerTemplate;
exports.registerTemplateForMemoryCache = registerTemplateForMemoryCache;
exports.registerTemplateForDatabase = registerTemplateForDatabase;
exports.getTemplateByName = getTemplateByName;
exports.processTemplateInfoForMemoryCache = processTemplateInfoForMemoryCache;
exports.processTemplateInfoForDatabase = processTemplateInfoForDatabase;
exports.registerTemplateParser = registerTemplateParser;
exports.renderTemplate = renderTemplate;
exports.compileHandlebarsTemplate = compileHandlebarsTemplate;
exports.renderHandlebarsTemplate = renderHandlebarsTemplate;
exports.renderTemplateToStaticMarkup = renderTemplateToStaticMarkup;
exports.resetRegisteredTemplates = resetRegisteredTemplates;
exports.initTemplates = initTemplates;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _server = require("react-dom/server");

var _server2 = _interopRequireDefault(_server);

var _handlebars = require("handlebars");

var _handlebars2 = _interopRequireDefault(_handlebars);

var _immutable = require("immutable");

var _immutable2 = _interopRequireDefault(_immutable);

var _collections = require("/lib/collections");

var _api = require("/server/api");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var registeredTemplates = _immutable2.default.OrderedMap();
var templateCache = _immutable2.default.Map();
var templateParsers = _immutable2.default.Map();

// var ReactComponentPrototype = React.Component.prototype
// var ReactClassComponentPrototype = (Object.getPrototypeOf(Object.getPrototypeOf(new (React.createClass({ render () {} }))())))

var TEMPLATE_PARSER_REACT = exports.TEMPLATE_PARSER_REACT = "react";
var TEMPLATE_PARSER_HANDLEBARS = exports.TEMPLATE_PARSER_HANDLEBARS = "handlebars";

function registerTemplate(templateInfo, shopId) {
  var insertImmediately = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  var literal = registerTemplateForMemoryCache(templateInfo, shopId);
  var reference = registerTemplateForDatabase(templateInfo, shopId, insertImmediately);

  return {
    templateLiteral: literal,
    templateReference: reference
  };
}

function registerTemplateForMemoryCache(templateInfo, shopId) {
  // Process template info and cache in memory.
  // This allows us to have function and class references for the templates for
  // React and other custom parsers
  var templateInfoForMemoryCache = processTemplateInfoForMemoryCache(templateInfo);
  var shopTemplates = registeredTemplates.get(shopId);

  if (!shopTemplates) {
    shopTemplates = {};
  }

  shopTemplates[templateInfo.name] = templateInfoForMemoryCache;
  registeredTemplates = registeredTemplates.set(shopId, shopTemplates);

  return templateInfoForMemoryCache;
}

function registerTemplateForDatabase(templateInfo) {
  // Process template info for use in a database
  // Namely, any literals like functions are stripped as they cannot be safetly,
  // and should not stored in the database
  var templateInfoForDatabase = processTemplateInfoForDatabase(templateInfo);

  // Import template into the Assets collecton.
  _collections.Assets.update({
    type: "template",
    name: templateInfoForDatabase.name
  }, {
    $set: {
      content: JSON.stringify(templateInfoForDatabase)
    }
  }, {
    upsert: true
  });

  // Return template data crafted for entry into a database
  return templateInfoForDatabase;
}

function getTemplateByName(templateName, shopId) {
  var registeredTemplate = registeredTemplates.get(shopId)[templateName];

  if (registeredTemplate) {
    return registeredTemplate;
  }

  var templateInfo = _collections.Templates.findOne({
    name: templateName,
    $or: [
    // Attemt to find user editable / edited templated first
    {
      isOriginalTemplate: false
    },
    // Fallback to the original templates
    {
      isOriginalTemplate: true
    }],
    shopId: shopId
  });

  return registerTemplateForMemoryCache(templateInfo);
}

function processTemplateInfoForMemoryCache(templateInfo) {
  // Avoid mutating the original passed in param
  var info = _immutable2.default.Map(templateInfo);

  if (typeof templateInfo.template === "string") {
    // Set the template parser to Handlebars for string based templates
    return info.set("parser", TEMPLATE_PARSER_HANDLEBARS).toObject();
  } else if (typeof templateInfo.template === "function") {
    // Set the parser to react for React components
    return info.set("parser", TEMPLATE_PARSER_REACT).toObject();
  } else if (_typeof(templateInfo.template) === "object") {
    // Set the parser to react for React components
    return info.set("parser", TEMPLATE_PARSER_REACT).toObject();
  }

  return null;
}

function processTemplateInfoForDatabase(templateInfo) {
  var templateData = {
    name: templateInfo.name,
    title: templateInfo.title,
    type: templateInfo.type,
    subject: templateInfo.subject,
    templateFor: templateInfo.templateFor
  };

  if (typeof templateInfo.template === "string") {
    templateData.template = templateInfo.template;
    templateData.parser = TEMPLATE_PARSER_HANDLEBARS;
  } else if (_typeof(templateInfo.template) === "object") {
    templateData.template = templateInfo.template;
    templateData.parser = TEMPLATE_PARSER_REACT;
  } else if (typeof templateInfo.template === "function") {
    templateData.parser = TEMPLATE_PARSER_REACT;
  }

  return templateData;
}

function registerTemplateParser(name, renderFunction) {
  templateParsers = templateParsers.set(name, renderFunction);
}

function renderTemplate(templateInfo) {
  var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (templateInfo.parser === TEMPLATE_PARSER_REACT) {
    return null;
  } else if (templateInfo.parser === TEMPLATE_PARSER_HANDLEBARS) {
    return renderHandlebarsTemplate(templateInfo, data);
  }

  if (typeof templateParsers.get(name) === "function") {
    return templateParsers.get(name)(templateInfo, data);
  }

  return false;
}

/**
 * Compile and cache Handlebars template
 * @param {String} name Name of template to register amd save to cache
 * @param {String} template markup
 * @return {Function} Compiled handlebars template.
 */
function compileHandlebarsTemplate(name, template) {
  var compiledTemplate = _handlebars2.default.compile(template);
  templateCache = templateCache.set(name, compiledTemplate);
  return compiledTemplate;
}

function renderHandlebarsTemplate(templateInfo, data) {
  if (templateCache[templateInfo.name] === undefined) {
    compileHandlebarsTemplate(templateInfo.name, templateInfo.template);
  }

  var compiledTemplate = templateCache.get(templateInfo.name);
  return compiledTemplate(data);
}

function renderTemplateToStaticMarkup(template, props) {
  return _server2.default.renderToStaticMarkup(_react2.default.createElement(template, props));
}

/**
 * Reset regestered templates
 * This is mostly useful for aiding in unit testing
 * @return {Immutable.OrderedMap} immultable.js OrderedMap
 */
function resetRegisteredTemplates() {
  registeredTemplates = _immutable2.default.OrderedMap();
}

function initTemplates() {
  /**
   * Hook to setup core Templates imports during Reaction init
   */
  _api.Hooks.Events.add("afterCoreInit", function () {
    _collections.Assets.find({ type: "template" }).forEach(function (t) {
      _api.Logger.debug("Importing " + t.name + " template");
      if (t.content) {
        _api.Reaction.Import.template(JSON.parse(t.content));
      } else {
        _api.Logger.debug("No template content found for " + t.name + " asset");
      }
    });
    _api.Reaction.Import.flush();
  });
}

exports.default = {
  get registeredTemplates() {
    return registeredTemplates;
  },
  get templateCache() {
    return templateCache;
  },
  get templateParsers() {
    return templateParsers;
  },
  registerTemplate: registerTemplate,
  getTemplateByName: getTemplateByName,
  processTemplateInfoForDatabase: processTemplateInfoForDatabase,
  processTemplateInfoForMemoryCache: processTemplateInfoForMemoryCache,
  compileHandlebarsTemplate: compileHandlebarsTemplate,
  renderHandlebarsTemplate: renderHandlebarsTemplate,
  renderTemplateToStaticMarkup: renderTemplateToStaticMarkup
};