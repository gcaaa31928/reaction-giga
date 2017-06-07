"use strict";

var _collections = require("/lib/collections");

var _api = require("/server/api");

/**
 * cart
 */

Meteor.publish("Cart", function (sessionId, userId) {
  check(sessionId, Match.OneOf(String, null));
  check(userId, Match.OptionalOrNull(String));
  // sessionId is required, not for selecting the cart, (userId), but as a key
  // in merging anonymous user carts into authenticated existing user carts.
  // we won't create carts unless we've got sessionId
  if (this.userId === null || sessionId === null) {
    return this.ready();
  }
  // use case happens between switching from anonymous to registered user. and
  // vice versa
  if (typeof userId === "string" && this.userId !== userId) {
    return this.ready();
  }
  // we have a very rare case when cart has not been created for an anonymous
  // and because of that, for some reason, he is considered as not logged in.
  // in that case he doesn't have `userId`. Only way for him to get userId is
  // to flush browser's session or log in as normal user. We could detect this
  // case from here by comparing this.userId is string and this.userId !==
  // Meteor.userId(). If this case will happens someday, we could try to send
  // some logout call to accounts. This is it: https://github.com/meteor/meteor/
  // issues/5103

  // shopId is also required.
  var shopId = _api.Reaction.getShopId();
  if (!shopId) {
    return this.ready();
  }

  // exclude these fields
  // from the client cart
  var fields = {
    taxes: 0
  };

  // select user cart
  var cart = _collections.Cart.find({
    userId: this.userId,
    shopId: shopId
  }, {
    fields: fields
  });

  if (cart.count()) {
    // we could keep `sessionId` of normal user up to date from here, but with
    // current session logic we don't need this. That's why we just return
    // cursor as is with whatever `sessionId`.
    return cart;
  }
  // we may create a cart if we didn't find one.
  var cartId = Meteor.call("cart/createCart", this.userId, sessionId);

  return _collections.Cart.find(cartId);
});

Meteor.publish("CartItemImage", function (cartItem) {
  check(cartItem, Match.Optional(Object));
  var productId = cartItem.productId;

  return _collections.Media.find({
    "metadata.productId": productId,
    "metadata.workflow": { $nin: ["archived", "unpublished"] }
  });
});