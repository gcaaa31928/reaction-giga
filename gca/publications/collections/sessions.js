"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ServerSessions = undefined;

var _mongo = require("meteor/mongo");

var _api = require("/server/api");

/**
 * Reaction Server / amplify permanent sessions
 * If no id is passed we create a new session
 * Load the session
 * If no session is loaded, creates a new one
 */

var ServerSessions = exports.ServerSessions = new _mongo.Mongo.Collection("Sessions");
undefined.ServerSessions = ServerSessions;

Meteor.publish("Sessions", function (sessionId) {
  check(sessionId, Match.OneOf(String, null));
  var created = new Date().getTime();
  var newSessionId = void 0;
  // if we don"t have a sessionId create a new session
  // REALLY - we should always have a client sessionId
  if (!sessionId) {
    newSessionId = ServerSessions.insert({
      created: created
    });
  } else {
    newSessionId = sessionId;
  }
  // get the session from existing sessionId
  var serverSession = ServerSessions.find(newSessionId);

  // if not found, also create a new server session
  if (serverSession.count() === 0) {
    ServerSessions.insert({
      _id: newSessionId,
      created: created
    });
  }

  // set global sessionId
  _api.Reaction.sessionId = newSessionId;

  // return cursor
  return ServerSessions.find(newSessionId);
});