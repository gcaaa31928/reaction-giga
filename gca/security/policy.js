"use strict";

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _browserPolicyCommon = require("meteor/browser-policy-common");

var _webapp = require("meteor/webapp");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Set headers for Reaction CDN
 */
_webapp.WebApp.rawConnectHandlers.use(function (req, res, next) {
  if (req._parsedUrl.pathname.match(/\.(ttf|ttc|otf|eot|woff|svg|font\.css|css)$/)) {
    res.setHeader("Access-Control-Allow-Origin", "assets.reactioncommerce.com");
  }
  next();
});

/**
 * Set browser policies
 */
if (process.env.NODE_ENV === "development") {
  _browserPolicyCommon.BrowserPolicy.content.allowOriginForAll("localhost:*");
  _browserPolicyCommon.BrowserPolicy.content.allowConnectOrigin("ws://localhost:*");
  _browserPolicyCommon.BrowserPolicy.content.allowConnectOrigin("http://localhost:*");
  _browserPolicyCommon.BrowserPolicy.content.allowConnectOrigin("https://localhost:*");
  _browserPolicyCommon.BrowserPolicy.framing.allowAll();
}

// get current hostname of app

var _url$parse = _url2.default.parse(Meteor.absoluteUrl()),
    hostname = _url$parse.hostname;

// allow websockets (Safari fails without this)


_browserPolicyCommon.BrowserPolicy.content.allowConnectOrigin("ws://" + hostname);
_browserPolicyCommon.BrowserPolicy.content.allowConnectOrigin("wss://" + hostname);

_browserPolicyCommon.BrowserPolicy.content.allowOriginForAll("*.facebook.com");
_browserPolicyCommon.BrowserPolicy.content.allowOriginForAll("*.fbcdn.net");
_browserPolicyCommon.BrowserPolicy.content.allowOriginForAll("connect.facebook.net");
_browserPolicyCommon.BrowserPolicy.content.allowOriginForAll("*.googleusercontent.com");

_browserPolicyCommon.BrowserPolicy.content.allowImageOrigin("fbcdn-profile-a.akamaihd.net");
_browserPolicyCommon.BrowserPolicy.content.allowImageOrigin("secure.gravatar.com");
_browserPolicyCommon.BrowserPolicy.content.allowImageOrigin("i0.wp.com");

_browserPolicyCommon.BrowserPolicy.content.allowFontDataUrl();
_browserPolicyCommon.BrowserPolicy.content.allowOriginForAll("assets.reactioncommerce.com");
_browserPolicyCommon.BrowserPolicy.content.allowOriginForAll("cdnjs.cloudflare.com");
_browserPolicyCommon.BrowserPolicy.content.allowOriginForAll("fonts.googleapis.com");
_browserPolicyCommon.BrowserPolicy.content.allowOriginForAll("fonts.gstatic.com");
_browserPolicyCommon.BrowserPolicy.content.allowOriginForAll("fonts.gstatic.com");

_browserPolicyCommon.BrowserPolicy.content.allowOriginForAll("enginex.kadira.io");
_browserPolicyCommon.BrowserPolicy.content.allowOriginForAll("*.stripe.com");