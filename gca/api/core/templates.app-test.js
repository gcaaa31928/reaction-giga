"use strict";

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _practicalmeteorChai = require("meteor/practicalmeteor:chai");

var _ = require("./");

var _2 = _interopRequireDefault(_);

var _templates = require("./templates");

var _collections = require("/lib/collections");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function sampleReactComponent() {
  return _react2.default.createElement(
    "div",
    null,
    "Test"
  );
}

describe("Templates:", function () {
  beforeEach(function () {
    _collections.Templates.direct.remove();
    (0, _templates.resetRegisteredTemplates)();
  });

  it("It should process a handlebars template for memory cache", function () {
    var expectedTemplate = (0, _templates.processTemplateInfoForMemoryCache)({
      name: "test-template",
      template: "<div>Test</div>"
    });

    (0, _practicalmeteorChai.expect)(expectedTemplate.name).to.be.equal("test-template");
    (0, _practicalmeteorChai.expect)(expectedTemplate.parser).to.be.equal(_templates.TEMPLATE_PARSER_HANDLEBARS);
  });

  it("It should process a react component for memory cache", function () {
    var expectedTemplate = (0, _templates.processTemplateInfoForMemoryCache)({
      name: "test-template",
      template: sampleReactComponent
    });

    (0, _practicalmeteorChai.expect)(expectedTemplate.name).to.be.equal("test-template");
    (0, _practicalmeteorChai.expect)(expectedTemplate.parser).to.be.equal(_templates.TEMPLATE_PARSER_REACT);
    (0, _practicalmeteorChai.expect)(expectedTemplate.template).to.be.a("function");
  });

  it("It should register Handlebars template", function () {
    var shopId = _2.default.getShopId();
    // Register template
    var sampleTemplate = {
      name: "test-template",
      template: "<div>Test</div>",
      type: "template"
    };
    (0, _templates.registerTemplate)(sampleTemplate, shopId);

    var actualTemplate = (0, _templates.getTemplateByName)("test-template", shopId);
    (0, _practicalmeteorChai.expect)(sampleTemplate.name).to.be.equal(actualTemplate.name);
    (0, _practicalmeteorChai.expect)(actualTemplate.parser).to.be.equal(_templates.TEMPLATE_PARSER_HANDLEBARS);
  });

  it("It should register Handlebars template and render to a string", function () {
    var shopId = _2.default.getShopId();
    // Register template
    var sampleTemplate = {
      name: "test-template",
      template: "<div>Test</div>",
      type: "template"
    };

    (0, _templates.registerTemplate)(sampleTemplate, shopId);

    var actualTemplate = (0, _templates.getTemplateByName)("test-template", shopId);
    (0, _practicalmeteorChai.expect)(sampleTemplate.name).to.be.equal(actualTemplate.name);
    (0, _practicalmeteorChai.expect)(actualTemplate.parser).to.be.equal(_templates.TEMPLATE_PARSER_HANDLEBARS);

    // Compile template to string
    var renderedHtmlString = (0, _templates.renderTemplate)(actualTemplate);
    (0, _practicalmeteorChai.expect)(renderedHtmlString).to.be.a("string");
  });

  it("It should register a React component", function () {
    var shopId = _2.default.getShopId();
    var sampleTemplate = {
      name: "test-template-react",
      template: sampleReactComponent,
      type: "template"
    };

    (0, _templates.registerTemplate)(sampleTemplate, shopId);

    var actualTemplate = (0, _templates.getTemplateByName)("test-template-react", shopId);

    (0, _practicalmeteorChai.expect)(sampleTemplate.name).to.be.equal(actualTemplate.name);
    (0, _practicalmeteorChai.expect)(actualTemplate.parser).to.be.equal(_templates.TEMPLATE_PARSER_REACT);
    (0, _practicalmeteorChai.expect)(actualTemplate.template).to.be.a("function");
  });
});