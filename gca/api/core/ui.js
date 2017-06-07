"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerTheme = registerTheme;

var _postcss = require("postcss");

var _postcss2 = _interopRequireDefault(_postcss);

var _postcssJs = require("postcss-js");

var _postcssJs2 = _interopRequireDefault(_postcssJs);

var _autoprefixer = require("autoprefixer");

var _autoprefixer2 = _interopRequireDefault(_autoprefixer);

var _cssAnnotation = require("css-annotation");

var _cssAnnotation2 = _interopRequireDefault(_cssAnnotation);

var _collections = require("/lib/collections");

var _core = require("./core");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var prefixer = _postcssJs2.default.sync([_autoprefixer2.default]);

function annotateCSS(stylesheet) {
  check(stylesheet, String);
  return _cssAnnotation2.default.parse(stylesheet);
}

function cssToObject(styles) {
  check(styles, Match.OneOf(String, null, undefined, void 0));

  var parsedStyle = _postcss2.default.parse(styles || baseStyles);
  var styleObject = _postcssJs2.default.objectify(parsedStyle);

  return styleObject;
}

function objectToCSS(styles) {
  var prefixedStyles = prefixer(styles);
  return (0, _postcss2.default)().process(prefixedStyles, { parser: _postcssJs2.default });
}

function themeToCSS(theme) {
  check(theme, Object);
  var output = "";

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = theme.components[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var component = _step.value;

      output += component.styles;
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

  return output;
}

function updateStyles(data) {
  check(data, Object);
  this.unblock();

  objectToCSS(data.styles).then(function (result) {
    if (result.css) {
      return _collections.Themes.update({
        "name": data.theme.name,
        "components.name": data.component.name
      }, {
        $set: _defineProperty({}, "components.$.styles", result.css)
      });
    }
  });
}

function publishTheme(theme) {
  check(theme, Object);
  this.unblock();
  var styles = themeToCSS(theme);

  _collections.Shops.update({
    _id: _core.Reaction.getShopId()
  }, {
    $set: {
      theme: {
        themeId: theme._id,
        styles: styles
      }
    }
  });
}

function registerTheme(styles) {
  check(styles, String);

  var annotations = _cssAnnotation2.default.parse(styles);
  var _annotations$ = annotations[0],
      name = _annotations$.name,
      label = _annotations$.label,
      theme = _annotations$.theme;


  var hasComponent = _collections.Themes.find({
    "name": theme,
    "components.name": name
  }).count();

  if (hasComponent) {
    _collections.Themes.update({
      "name": theme,
      "components.name": name
    }, {
      $set: {
        "components.$": {
          name: name,
          label: label || name,
          styles: styles,
          annotations: annotations
        }
      }
    });
  } else {
    _collections.Themes.upsert({
      name: theme
    }, {
      $set: {
        name: theme
      },
      $push: {
        components: {
          name: name,
          label: label || name,
          styles: styles,
          annotations: annotations
        }
      }
    });
  }
}

function duplicateTheme(name) {
  check(name, String);

  var theme = _collections.Themes.find({
    theme: name
  });

  delete theme._id;
  theme.name = name + " copy";

  return _collections.Themes.insert(theme);
}

Meteor.methods({
  "ui/updateStyles": updateStyles,
  "ui/publishTheme": publishTheme,
  "ui/cssToObject": cssToObject,
  "ui/registerTheme": registerTheme,
  "ui/processAnnotations": annotateCSS,
  "ui/duplicateTheme": duplicateTheme,
  "ui/themeToCSS": themeToCSS
});