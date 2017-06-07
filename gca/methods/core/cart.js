"use strict";

var _clone2 = require("lodash/clone");

var _clone3 = _interopRequireDefault(_clone2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _meteor = require("meteor/meteor");

var _check = require("meteor/check");

var _collections = require("/lib/collections");

var Collections = _interopRequireWildcard(_collections);

var _api = require("/server/api");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * quantityProcessing
 * @summary perform calculations admissibility of adding product to cart
 * @param {Object} product - product to add to Cart
 * @param {Object} variant - product variant
 * @param {Number} itemQty - qty to add to cart, defaults to 1, deducts
 *  from inventory
 * @since 1.10.1
 * @return {Number} quantity - revised quantity to be added to cart
 */
function quantityProcessing(product, variant) {
  var itemQty = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

  var quantity = itemQty;
  var MIN = variant.minOrderQuantity || 1;
  var MAX = variant.inventoryQuantity || Infinity;

  if (MIN > MAX) {
    _api.Logger.debug("productId: " + product._id + ", variantId " + variant._id + ": inventoryQuantity lower then minimum order");
    throw new _meteor.Meteor.Error("productId: " + product._id + ", variantId " + variant._id + ": inventoryQuantity lower then minimum order");
  }

  // TODO: think about #152 implementation here
  switch (product.type) {
    case "not-in-stock":
      break;
    default:
      // type: `simple` // todo: maybe it should be "variant"
      if (quantity < MIN) {
        quantity = MIN;
      } else if (variant.inventoryPolicy && quantity > MAX) {
        quantity = MAX;
      }
  }

  return quantity;
}

/**
 * getSessionCarts
 * @summary get Cart cursor with all session carts
 * @param {String} userId - current user _id
 * @param {String} sessionId - current user session id
 * @param {String} shopId - shop id
 * @since 0.10.2
 * @return {Mongo.Cursor} with array of session carts
 */
function getSessionCarts(userId, sessionId, shopId) {
  var carts = Collections.Cart.find({
    $and: [{
      userId: {
        $ne: userId
      }
    }, {
      sessionId: {
        $eq: sessionId
      }
    }, {
      shopId: {
        $eq: shopId
      }
    }]
  });

  // we can't use Array.map here, because we need to reduce the number of array
  // elements if element belongs to registered user, we should throw it.
  var allowedCarts = [];

  // only anonymous user carts allowed
  carts.forEach(function (cart) {
    if (Roles.userIsInRole(cart.userId, "anonymous", shopId)) {
      allowedCarts.push(cart);
    }
  });

  return allowedCarts;
}

/**
 * Reaction Cart Methods
 */

_meteor.Meteor.methods({
  /**
   * cart/mergeCart
   * @summary merge matching sessionId cart into specified userId cart
   *
   * There should be one cart for each independent, non logged in user session
   * When a user logs in that cart now belongs to that user and we use the a
   * single user cart.
   * If they are logged in on more than one devices, regardless of session,the
   * user cart will be used
   * If they had more than one cart, on more than one device,logged in at
   * separate times then merge the carts
   *
   * @param {String} cartId - cartId of the cart to merge matching session
   * carts into.
   * @param {String} [currentSessionId] - current client session id
   * @todo I think this method should be moved out from methods to a Function
   * Declaration to keep it more secure
   * @return {Object|Boolean} cartId - cartId on success or false
   */
  "cart/mergeCart": function cartMergeCart(cartId, currentSessionId) {
    var _this = this;

    (0, _check.check)(cartId, String);
    (0, _check.check)(currentSessionId, Match.Optional(String));

    // we don't process current cart, but merge into it.
    var currentCart = Collections.Cart.findOne(cartId);
    if (!currentCart) {
      throw new _meteor.Meteor.Error("access-denied", "Access Denied");
    }
    // just used to filter out the current cart
    // we do additional check of cart exists here and if it not exist, next
    // check supposed to throw 403 error
    var userId = currentCart && currentCart.userId;
    // user should have an access to operate with only one - his - cart
    if (this.userId !== null && userId !== this.userId) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }
    // persistent sessions, see: publications/sessions.js
    // this is the last place where we still need `Reaction.sessionId`.
    // The use case is: on user log in. I don't know how pass `sessionId` down
    // at that moment.
    var sessionId = currentSessionId || _api.Reaction.sessionId;
    var shopId = _api.Reaction.getShopId();

    // no need to merge anonymous carts
    if (Roles.userIsInRole(userId, "anonymous", shopId)) {
      return false;
    }
    _api.Logger.debug("merge cart: matching sessionId");
    _api.Logger.debug("current userId:", userId);
    _api.Logger.debug("sessionId:", sessionId);
    // get session carts without current user cart cursor
    var sessionCarts = getSessionCarts(userId, sessionId, shopId);

    _api.Logger.debug("merge cart: begin merge processing of session " + sessionId + " into: " + currentCart._id);
    // loop through session carts and merge into user cart
    sessionCarts.forEach(function (sessionCart) {
      _api.Logger.debug("merge cart: merge user userId: " + userId + ", sessionCart.userId: " + sessionCart.userId + ", sessionCart id: " + sessionCart._id);
      // really if we have no items, there's nothing to merge
      if (sessionCart.items) {
        // if currentCart already have a cartWorkflow, we don't need to clean it
        // up completely, just to `coreCheckoutShipping` stage. Also, we will
        // need to recalculate shipping rates
        if (_typeof(currentCart.workflow) === "object" && _typeof(currentCart.workflow.workflow) === "object") {
          if (currentCart.workflow.workflow.length > 2) {
            _meteor.Meteor.call("workflow/revertCartWorkflow", "coreCheckoutShipping");
            // refresh shipping quotes
            _meteor.Meteor.call("shipping/updateShipmentQuotes", cartId);
          }
        } else {
          // if user logged in he doesn't need to show `checkoutLogin` step
          _meteor.Meteor.call("workflow/revertCartWorkflow", "checkoutAddressBook");
        }

        // We got an additional db call because of `workflow/revertCartWorkflow`
        // call, but we also got things more cleaner in my opinion.
        // merge session cart into current cart
        Collections.Cart.update(currentCart._id, {
          $addToSet: {
            items: {
              $each: sessionCart.items
            }
          }
        });
      }

      // cleanup session Carts after merge.
      if (sessionCart.userId !== _this.userId) {
        // clear the cart that was used for a session
        // and we're also going to do some garbage Collection
        Collections.Cart.remove(sessionCart._id);
        // cleanup user/accounts
        Collections.Accounts.remove({
          userId: sessionCart.userId
        });
        _meteor.Meteor.users.remove(sessionCart.userId);
        _api.Logger.debug("merge cart: delete cart " + sessionCart._id + " and user: " + sessionCart.userId);
      }
      _api.Logger.debug("merge cart: processed merge for cartId " + sessionCart._id);
    });

    // `checkoutLogin` should be used for anonymous only. Registered users
    // no need see this.
    if (currentCart.workflow.status === "new") {
      // to call `workflow/pushCartWorkflow` two times is the only way to move
      // from status "new" to "checkoutAddressBook" which I found without
      // refactoring of `workflow/pushCartWorkflow`
      // We send `cartId` as arguments because this method could be called from
      // publication method and in half cases it could be so, that
      // Meteor.userId() will be null.
      _meteor.Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "checkoutLogin", cartId);
      _meteor.Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "checkoutAddressBook", cartId);
    }

    return currentCart._id;
  },

  /**
   * cart/createCart
   * @description create new cart for user, but all checks for current cart's
   * existence should go before this method will be called, to keep it clean
   * @summary create and return new cart for user
   * @param {String} userId - userId to create cart for
   * @param {String} sessionId - current client session id
   * @todo I think this method should be moved out from methods to a Function
   * Declaration to keep it more secure
   * @returns {String} cartId - users cartId
   */
  "cart/createCart": function cartCreateCart(userId, sessionId) {
    (0, _check.check)(userId, String);
    (0, _check.check)(sessionId, String);

    var shopId = _api.Reaction.getShopId();
    // check if user has `anonymous` role.( this is a visitor)
    var anonymousUser = Roles.userIsInRole(userId, "anonymous", shopId);
    var sessionCartCount = getSessionCarts(userId, sessionId, shopId).length;

    _api.Logger.debug("create cart: shopId", shopId);
    _api.Logger.debug("create cart: userId", userId);
    _api.Logger.debug("create cart: sessionId", sessionId);
    _api.Logger.debug("create cart: sessionCarts.count", sessionCartCount);
    _api.Logger.debug("create cart: anonymousUser", anonymousUser);

    // we need to create a user cart for the new authenticated user or
    // anonymous.
    var currentCartId = Collections.Cart.insert({
      sessionId: sessionId,
      userId: userId
    });
    _api.Logger.debug("create cart: into new user cart. created: " + currentCartId + " for user " + userId);

    // merge session carts into the current cart
    if (sessionCartCount > 0 && !anonymousUser) {
      _api.Logger.debug("create cart: found existing cart. merge into " + currentCartId + " for user " + userId);
      _meteor.Meteor.call("cart/mergeCart", currentCartId, sessionId);
    }

    // we should check for an default billing/shipping address in user account.
    // this needed after submitting order, when user receives new cart
    var account = Collections.Accounts.findOne(userId);
    if (account && account.profile && account.profile.addressBook) {
      account.profile.addressBook.forEach(function (address) {
        if (address.isBillingDefault) {
          _meteor.Meteor.call("cart/setPaymentAddress", currentCartId, address);
        }
        if (address.isShippingDefault) {
          _meteor.Meteor.call("cart/setShipmentAddress", currentCartId, address);
        }
      });
    }

    // attach current user currency to cart
    var currentUser = _meteor.Meteor.user();
    var userCurrency = _api.Reaction.getShopCurrency();

    // Check to see if the user has a custom currency saved to their profile
    // Use it if they do
    if (currentUser && currentUser.profile && currentUser.profile.currency) {
      userCurrency = currentUser.profile.currency;
    }
    _meteor.Meteor.call("cart/setUserCurrency", currentCartId, userCurrency);

    return currentCartId;
  },

  /**
   *  cart/addToCart
   *  @summary add items to a user cart
   *  when we add an item to the cart, we want to break all relationships
   *  with the existing item. We want to fix price, qty, etc into history
   *  however, we could check reactively for price /qty etc, adjustments on
   *  the original and notify them
   *  @param {String} productId - productId to add to Cart
   *  @param {String} variantId - product variant _id
   *  @param {Number} [itemQty] - qty to add to cart
   *  @return {Number|Object} Mongo insert response
   */
  "cart/addToCart": function cartAddToCart(productId, variantId, itemQty) {
    (0, _check.check)(productId, String);
    (0, _check.check)(variantId, String);
    (0, _check.check)(itemQty, Match.Optional(Number));

    var cart = Collections.Cart.findOne({ userId: this.userId });
    if (!cart) {
      _api.Logger.error("Cart not found for user: " + this.userId);
      throw new _meteor.Meteor.Error(404, "Cart not found", "Cart not found for user with such id");
    }
    // With the flattened model we no longer need to work directly with the
    // products. But product still could be necessary for a `quantityProcessing`
    // TODO: need to understand: do we really need product inside
    // `quantityProcessing`?
    var product = void 0;
    var variant = void 0;
    Collections.Products.find({ _id: { $in: [productId, variantId] } }).forEach(function (doc) {
      if (doc.type === "simple") {
        product = doc;
      } else {
        variant = doc;
      }
    });

    // TODO: this lines still needed. We could uncomment them in future if
    // decide to not completely remove product data from this method
    // const product = Collections.Products.findOne(productId);
    // const variant = Collections.Products.findOne(variantId);
    if (!product) {
      _api.Logger.warn("Product: " + productId + " was not found in database");
      throw new _meteor.Meteor.Error(404, "Product not found", "Product with such id was not found!");
    }
    if (!variant) {
      _api.Logger.warn("Product variant: " + variantId + " was not found in database");
      throw new _meteor.Meteor.Error(404, "ProductVariant not found", "ProductVariant with such id was not found!");
    }
    // performs calculations admissibility of adding product to cart
    var quantity = quantityProcessing(product, variant, itemQty);
    // performs search of variant inside cart
    var cartVariantExists = cart.items && cart.items.some(function (item) {
      return item.variants._id === variantId;
    });

    if (cartVariantExists) {
      return Collections.Cart.update({
        "_id": cart._id,
        "items.variants._id": variantId
      }, {
        $inc: {
          "items.$.quantity": quantity
        }
      }, function (error, result) {
        if (error) {
          _api.Logger.warn("error adding to cart", Collections.Cart.simpleSchema().namedContext().invalidKeys());
          return error;
        }

        // refresh shipping quotes
        _meteor.Meteor.call("shipping/updateShipmentQuotes", cart._id);
        // revert workflow to checkout shipping step.
        _meteor.Meteor.call("workflow/revertCartWorkflow", "coreCheckoutShipping");
        // reset selected shipment method
        _meteor.Meteor.call("cart/resetShipmentMethod", cart._id);

        _api.Logger.debug("cart: increment variant " + variantId + " quantity by " + quantity);

        return result;
      });
    }

    // cart variant doesn't exist
    return Collections.Cart.update({
      _id: cart._id
    }, {
      $addToSet: {
        items: {
          _id: Random.id(),
          shopId: product.shopId,
          productId: productId,
          quantity: quantity,
          variants: variant,
          title: product.title,
          type: product.type,
          parcel: product.parcel || null
        }
      }
    }, function (error, result) {
      if (error) {
        _api.Logger.error(error);
        _api.Logger.error(Collections.Cart.simpleSchema().namedContext().invalidKeys(), "Invalid keys. Error adding to cart.");
        return error;
      }

      // refresh shipping quotes
      _meteor.Meteor.call("shipping/updateShipmentQuotes", cart._id);
      // revert workflow to checkout shipping step.
      _meteor.Meteor.call("workflow/revertCartWorkflow", "coreCheckoutShipping");
      // reset selected shipment method
      _meteor.Meteor.call("cart/resetShipmentMethod", cart._id);

      _api.Logger.debug("cart: add variant " + variantId + " to cartId " + cart._id);

      return result;
    });
  },

  /**
   * cart/removeFromCart
   * @summary removes or adjust quantity of a variant from the cart
   * @param {String} itemId - cart item _id
   * @param {Number} [quantity] - if provided will adjust increment by quantity
   * @returns {Number} returns Mongo update result
   */
  "cart/removeFromCart": function cartRemoveFromCart(itemId, quantity) {
    (0, _check.check)(itemId, String);
    (0, _check.check)(quantity, Match.Optional(Number));

    var userId = _meteor.Meteor.userId();
    var cart = Collections.Cart.findOne({
      userId: userId
    });
    if (!cart) {
      _api.Logger.error("Cart not found for user: " + this.userId);
      throw new _meteor.Meteor.Error("cart-not-found", "Cart not found for user with such id");
    }

    var cartItem = void 0;

    if (cart.items) {
      cartItem = (0, _find3.default)(cart.items, function (item) {
        return item._id === itemId;
      });
    }

    // extra check of item exists
    if ((typeof cartItem === "undefined" ? "undefined" : _typeof(cartItem)) !== "object") {
      _api.Logger.error("Unable to find an item: " + itemId + " within the cart: " + cart._id);
      throw new _meteor.Meteor.Error("cart-item-not-found", "Unable to find an item with such id in cart.");
    }

    // refresh shipping quotes
    _meteor.Meteor.call("shipping/updateShipmentQuotes", cart._id);
    // revert workflow to checkout shipping step.
    _meteor.Meteor.call("workflow/revertCartWorkflow", "coreCheckoutShipping");
    // reset selected shipment method
    _meteor.Meteor.call("cart/resetShipmentMethod", cart._id);

    if (!quantity || quantity >= cartItem.quantity) {
      return Collections.Cart.update({
        _id: cart._id
      }, {
        $pull: {
          items: {
            _id: itemId
          }
        }
      }, function (error, result) {
        if (error) {
          _api.Logger.error(error);
          _api.Logger.error(Collections.Cart.simpleSchema().namedContext().invalidKeys(), "error removing from cart");
          return error;
        }
        _api.Logger.debug("cart: deleted cart item variant id " + cartItem.variants._id);
        return result;
      });
    }

    // if quantity lets convert to negative and increment
    var removeQuantity = Math.abs(quantity) * -1;
    return Collections.Cart.update({
      "_id": cart._id,
      "items._id": cartItem._id
    }, {
      $inc: {
        "items.$.quantity": removeQuantity
      }
    }, function (error, result) {
      if (error) {
        _api.Logger.error(error);
        _api.Logger.error(Collections.Cart.simpleSchema().namedContext().invalidKeys(), "error removing from cart");
        return error;
      }
      _api.Logger.debug("cart: removed variant " + cartItem._id + " quantity of " + quantity);
      return result;
    });
  },

  /**
   * cart/copyCartToOrder
   * @summary transform cart to order when a payment is processed we want to
   * copy the cart over to an order object, and give the user a new empty
   * cart. reusing the cart schema makes sense, but integrity of the order, we
   * don't want to just make another cart item
   * @todo:  Partial order processing, shopId processing
   * @todo:  Review Security on this method
   * @param {String} cartId - cartId to transform to order
   * @return {String} returns orderId
   */
  "cart/copyCartToOrder": function cartCopyCartToOrder(cartId) {
    (0, _check.check)(cartId, String);
    var cart = Collections.Cart.findOne(cartId);
    // security check
    if (cart.userId !== this.userId) {
      throw new _meteor.Meteor.Error(403, "Access Denied");
    }
    var order = Object.assign({}, cart);
    var sessionId = cart.sessionId;

    if (!order.items || order.items.length === 0) {
      var msg = "An error occurred saving the order. Missing cart items.";
      _api.Logger.error(msg);
      throw new _meteor.Meteor.Error("no-cart-items", msg);
    }

    _api.Logger.debug("cart/copyCartToOrder", cartId);
    // reassign the id, we'll get a new orderId
    order.cartId = cart._id;

    // a helper for guest login, we let guest add email afterwords
    // for ease, we'll also add automatically for logged in users
    if (order.userId && !order.email) {
      var user = Collections.Accounts.findOne(order.userId);
      // we could have a use case here when email is not defined by some reason,
      // we could throw an error, but it's not pretty clever, so let it go w/o
      // email
      if ((typeof user === "undefined" ? "undefined" : _typeof(user)) === "object" && user.emails) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = user.emails[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var email = _step.value;

            // alternate order email address
            if (email.provides === "orders") {
              order.email = email.address;
            } else if (email.provides === "default") {
              order.email = email.address;
            }
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
      }
    }

    // schema should provide order defaults
    // so we'll delete the cart autovalues
    delete order.createdAt; // autovalues
    delete order.updatedAt;
    delete order.cartCount;
    delete order.cartShipping;
    delete order.cartSubTotal;
    delete order.cartTaxes;
    delete order.cartDiscounts;
    delete order.cartTotal;
    delete order._id;

    // `order.shipping` is array ?
    if (Array.isArray(order.shipping)) {
      if (order.shipping.length > 0) {
        order.shipping[0].paymentId = order.billing[0]._id;

        if (!Array.isArray(order.shipping[0].items)) {
          order.shipping[0].items = [];
        }
      }
    } else {
      // if not - create it
      order.shipping = [];
    }

    // Add current exchange rate into order.billing.currency
    // If user currenct === shop currency, exchange rate = 1.0
    var currentUser = _meteor.Meteor.user();
    var userCurrency = _api.Reaction.getShopCurrency();
    var exchangeRate = "1.00";

    if (currentUser && currentUser.profile && currentUser.profile.currency) {
      userCurrency = _meteor.Meteor.user().profile.currency;
    }

    if (userCurrency !== _api.Reaction.getShopCurrency()) {
      var userExchangeRate = _meteor.Meteor.call("shop/getCurrencyRates", userCurrency);

      if (typeof userExchangeRate === "number") {
        exchangeRate = userExchangeRate;
      } else {
        _api.Logger.warn("Failed to get currency exchange rates. Setting exchange rate to null.");
        exchangeRate = null;
      }
    }

    if (!order.billing[0].currency) {
      order.billing[0].currency = {
        userCurrency: userCurrency
      };
    }

    (0, _each3.default)(order.items, function (item) {
      if (order.shipping[0].items) {
        order.shipping[0].items.push({
          _id: item._id,
          productId: item.productId,
          shopId: item.shopId,
          variantId: item.variants._id
        });
      }
    });

    order.shipping[0].items.packed = false;
    order.shipping[0].items.shipped = false;
    order.shipping[0].items.delivered = false;

    order.billing[0].currency.exchangeRate = exchangeRate;
    order.workflow.status = "new";
    order.workflow.workflow = ["coreOrderWorkflow/created"];

    // insert new reaction order
    var orderId = Collections.Orders.insert(order);

    if (orderId) {
      Collections.Cart.remove({
        _id: order.cartId
      });
      // create a new cart for the user
      // even though this should be caught by
      // subscription handler, it's not always working
      var newCartExists = Collections.Cart.find({ userId: order.userId });
      if (newCartExists.count() === 0) {
        _meteor.Meteor.call("cart/createCart", this.userId, sessionId);
        // after recreate new cart we need to make it looks like previous by
        // updating `cart/workflow/status` to "coreCheckoutShipping"
        // by calling `workflow/pushCartWorkflow` three times. This is the only
        // way to do that without refactoring of `workflow/pushCartWorkflow`
        _meteor.Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "checkoutLogin");
        _meteor.Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "checkoutAddressBook");
        _meteor.Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "coreCheckoutShipping");
      }

      _api.Logger.info("Transitioned cart " + cartId + " to order " + orderId);
      // catch send notification, we don't want
      // to block because of notification errors

      if (order.email) {
        _meteor.Meteor.call("orders/sendNotification", Collections.Orders.findOne(orderId), function (err) {
          if (err) {
            _api.Logger.error(err, "Error in orders/sendNotification for order " + orderId);
          }
        });
      }

      // order success
      return orderId;
    }
    // we should not have made it here, throw error
    throw new _meteor.Meteor.Error(400, "cart/copyCartToOrder: Invalid request");
  },

  /**
   * cart/setShipmentMethod
   * @summary saves method as order default
   * @param {String} cartId - cartId to apply shipmentMethod
   * @param {Object} method - shipmentMethod object
   * @return {Number} return Mongo update result
   */
  "cart/setShipmentMethod": function cartSetShipmentMethod(cartId, method) {
    (0, _check.check)(cartId, String);
    (0, _check.check)(method, Object);
    // get current cart
    var cart = Collections.Cart.findOne({
      _id: cartId,
      userId: _meteor.Meteor.userId()
    });
    if (!cart) {
      _api.Logger.error("Cart not found for user: " + this.userId);
      throw new _meteor.Meteor.Error(404, "Cart not found", "Cart not found for user with such id");
    }

    // temp hack until we build out multiple shipping handlers
    var selector = void 0;
    var update = void 0;
    // temp hack until we build out multiple shipment handlers
    // if we have an existing item update it, otherwise add to set.
    if (cart.shipping) {
      selector = {
        "_id": cartId,
        "shipping._id": cart.shipping[0]._id
      };
      update = {
        $set: {
          "shipping.$.shipmentMethod": method
        }
      };
    } else {
      selector = {
        _id: cartId
      };
      update = {
        $addToSet: {
          shipping: {
            shipmentMethod: method
          }
        }
      };
    }

    // update or insert method
    try {
      Collections.Cart.update(selector, update);
    } catch (e) {
      _api.Logger.error(e, "Error adding rates to cart " + cartId);
      throw new _meteor.Meteor.Error("An error occurred saving the order", e);
    }

    // this will transition to review
    return _meteor.Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "coreCheckoutShipping");
  },

  /**
   * cart/setUserCurrency
   * @summary saves user currency in cart, to be paired with order/setCurrencyExhange
   * @param {String} cartId - cartId to apply setUserCurrency
   * @param {String} userCurrency - userCurrency to set to cart
   * @return {Number} update result
   */
  "cart/setUserCurrency": function cartSetUserCurrency(cartId, userCurrency) {
    (0, _check.check)(cartId, String);
    (0, _check.check)(userCurrency, String);
    var cart = Collections.Cart.findOne({
      _id: cartId
    });
    if (!cart) {
      _api.Logger.error("Cart not found for user: " + this.userId);
      throw new _meteor.Meteor.Error("Cart not found for user with such id");
    }

    var userCurrencyString = {
      userCurrency: userCurrency
    };

    var selector = void 0;
    var update = void 0;

    if (cart.billing) {
      selector = {
        "_id": cartId,
        "billing._id": cart.billing[0]._id
      };
      update = {
        $set: {
          "billing.$.currency": userCurrencyString
        }
      };
    } else {
      selector = {
        _id: cartId
      };
      update = {
        $addToSet: {
          billing: {
            currency: userCurrencyString
          }
        }
      };
    }

    // add / or set the shipping address
    try {
      Collections.Cart.update(selector, update);
    } catch (e) {
      _api.Logger.error(e);
      throw new _meteor.Meteor.Error("An error occurred adding the currency");
    }

    return true;
  },

  /**
   * cart/resetShipmentMethod
   * @summary removes `shipmentMethod` object from cart
   * @param {String} cartId - cart _id
   * @return {Number} update result
   */
  "cart/resetShipmentMethod": function cartResetShipmentMethod(cartId) {
    (0, _check.check)(cartId, String);

    var cart = Collections.Cart.findOne({
      _id: cartId,
      userId: this.userId
    });
    if (!cart) {
      _api.Logger.error("Cart not found for user: " + this.userId);
      throw new _meteor.Meteor.Error(404, "Cart not found", "Cart: " + cartId + " not found for user: " + this.userId);
    }

    return Collections.Cart.update({ _id: cartId }, {
      $unset: { "shipping.0.shipmentMethod": "" }
    });
  },

  /**
   * cart/setShipmentAddress
   * @summary adds address book to cart shipping
   * @param {String} cartId - cartId to apply shipmentMethod
   * @param {Object} address - addressBook object
   * @return {Number} update result
   */
  "cart/setShipmentAddress": function cartSetShipmentAddress(cartId, address) {
    (0, _check.check)(cartId, String);
    (0, _check.check)(address, _api.Reaction.Schemas.Address);

    var cart = Collections.Cart.findOne({
      _id: cartId,
      userId: this.userId
    });
    if (!cart) {
      _api.Logger.error("Cart not found for user: " + this.userId);
      throw new _meteor.Meteor.Error(404, "Cart not found", "Cart not found for user with such id");
    }

    var selector = void 0;
    var update = void 0;
    // temp hack until we build out multiple shipment handlers
    // if we have an existing item update it, otherwise add to set.
    if (Array.isArray(cart.shipping) && cart.shipping.length > 0) {
      selector = {
        "_id": cartId,
        "shipping._id": cart.shipping[0]._id
      };
      update = {
        $set: {
          "shipping.$.address": address
        }
      };
    } else {
      selector = {
        _id: cartId
      };
      update = {
        $addToSet: {
          shipping: {
            address: address
          }
        }
      };
    }

    // add / or set the shipping address
    try {
      Collections.Cart.update(selector, update);
    } catch (e) {
      _api.Logger.error(e);
      throw new _meteor.Meteor.Error("An error occurred adding the address");
    }

    // refresh shipping quotes
    _meteor.Meteor.call("shipping/updateShipmentQuotes", cartId);

    if (_typeof(cart.workflow) !== "object") {
      throw new _meteor.Meteor.Error(500, "Internal Server Error", "Cart workflow object not detected.");
    }

    // ~~it's ok for this to be called multiple times~~
    // call it only once when we at the `checkoutAddressBook` step
    if (_typeof(cart.workflow.workflow) === "object" && cart.workflow.workflow.length < 2) {
      _meteor.Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "coreCheckoutShipping");
    }

    // if we change default address during further steps, we need to revert
    // workflow back to `coreCheckoutShipping` step
    if (_typeof(cart.workflow.workflow) === "object" && cart.workflow.workflow.length > 2) {
      // "2" index of
      // `coreCheckoutShipping`
      _meteor.Meteor.call("workflow/revertCartWorkflow", "coreCheckoutShipping");
    }

    return true;
  },

  /**
   * cart/setPaymentAddress
   * @summary adds addressbook to cart payments
   * @param {String} cartId - cartId to apply payment address
   * @param {Object} address - addressBook object
   * @todo maybe we need to rename this method to `cart/setBillingAddress`?
   * @return {Number} return Mongo update result
   */
  "cart/setPaymentAddress": function cartSetPaymentAddress(cartId, address) {
    (0, _check.check)(cartId, String);
    (0, _check.check)(address, _api.Reaction.Schemas.Address);

    var cart = Collections.Cart.findOne({
      _id: cartId,
      userId: this.userId
    });

    if (!cart) {
      _api.Logger.error("Cart not found for user: " + this.userId);
      throw new _meteor.Meteor.Error(404, "Cart not found", "Cart not found for user with such id");
    }

    var selector = void 0;
    var update = void 0;
    // temp hack until we build out multiple billing handlers
    // if we have an existing item update it, otherwise add to set.
    if (Array.isArray(cart.billing) && cart.billing.length > 0) {
      selector = {
        "_id": cartId,
        "billing._id": cart.billing[0]._id
      };
      update = {
        $set: {
          "billing.$.address": address
        }
      };
    } else {
      selector = {
        _id: cartId
      };
      update = {
        $addToSet: {
          billing: {
            address: address
          }
        }
      };
    }

    return Collections.Cart.update(selector, update);
  },

  /**
   * cart/unsetAddresses
   * @description removes address from cart.
   * @param {String} addressId - address._id
   * @param {String} userId - cart owner _id
   * @param {String} [type] - billing default or shipping default
   * @since 0.10.1
   * @todo check if no more address in cart as shipping, we should reset
   * `cartWorkflow` to second step
   * @return {Number|Object|Boolean} The number of removed documents or error
   * object or `false` if we don't need to update cart
   */
  "cart/unsetAddresses": function cartUnsetAddresses(addressId, userId, type) {
    (0, _check.check)(addressId, String);
    (0, _check.check)(userId, String);
    (0, _check.check)(type, Match.Optional(String));

    // do we actually need to change anything?
    var needToUpdate = false;
    // we need to revert the workflow after a "shipping" address was removed
    var isShippingDeleting = false;
    var cart = Collections.Cart.findOne({
      userId: userId
    });
    var selector = {
      _id: cart._id
    };
    var update = { $unset: {} };
    // user could turn off the checkbox in address to not to be default, then we
    // receive `type` arg
    if (typeof type === "string") {
      // we assume that the billing/shipping arrays can hold only one element [0]
      if (cart[type] && _typeof(cart[type][0].address) === "object" && cart[type][0].address._id === addressId) {
        update.$unset[type + ".0.address"] = "";
        needToUpdate = true;
        isShippingDeleting = type === "shipping";
      }
    } else {
      // or if we remove address itself, when we run this part we assume
      // that the billing/shipping arrays can hold only one element [0]
      if (cart.billing && _typeof(cart.billing[0].address) === "object" && cart.billing[0].address._id === addressId) {
        update.$unset["billing.0.address"] = "";
        needToUpdate = true;
      }
      if (cart.shipping && _typeof(cart.shipping[0].address) === "object" && cart.shipping[0].address._id === addressId) {
        update.$unset["shipping.0.address"] = "";
        needToUpdate = true;
        isShippingDeleting = true;
      }
    }

    if (needToUpdate) {
      try {
        Collections.Cart.update(selector, update);
      } catch (e) {
        _api.Logger.error(e);
        throw new _meteor.Meteor.Error("Error updating cart");
      }

      if (isShippingDeleting) {
        // if we remove shipping address from cart, we need to revert
        // `cartWorkflow` to the `checkoutAddressBook` step.
        _meteor.Meteor.call("workflow/revertCartWorkflow", "checkoutAddressBook");
      }
    }
    return true;
  },

  /**
   * cart/submitPayment
   * @summary saves a submitted payment to cart, triggers workflow
   * and adds "paymentSubmitted" to cart workflow
   * Note: this method also has a client stub, that forwards to cartCompleted
   * @param {Object} paymentMethod - paymentMethod object
   * directly within this method, just throw down though hooks
   * @return {String} returns update result
   */
  "cart/submitPayment": function cartSubmitPayment(paymentMethod) {
    (0, _check.check)(paymentMethod, _api.Reaction.Schemas.PaymentMethod);

    var checkoutCart = Collections.Cart.findOne({
      userId: _meteor.Meteor.userId()
    });

    var cart = (0, _clone3.default)(checkoutCart);
    var cartId = cart._id;
    var invoice = {
      shipping: cart.cartShipping(),
      subtotal: cart.cartSubTotal(),
      taxes: cart.cartTaxes(),
      discounts: cart.cartDiscounts(),
      total: cart.cartTotal()
    };

    // we won't actually close the order at this stage.
    // we'll just update the workflow and billing data where
    // method-hooks can process the workflow update.

    var selector = void 0;
    var update = void 0;
    // temp hack until we build out multiple billing handlers
    // if we have an existing item update it, otherwise add to set.
    if (cart.billing) {
      selector = {
        "_id": cartId,
        "billing._id": cart.billing[0]._id
      };
      update = {
        $set: {
          "billing.$.paymentMethod": paymentMethod,
          "billing.$.invoice": invoice
        }
      };
    } else {
      selector = {
        _id: cartId
      };
      update = {
        $addToSet: {
          "billing.paymentMethod": paymentMethod,
          "billing.invoice": invoice
        }
      };
    }

    try {
      Collections.Cart.update(selector, update);
    } catch (e) {
      _api.Logger.error(e);
      throw new _meteor.Meteor.Error("An error occurred saving the order");
    }

    return Collections.Cart.findOne(selector);
  }
});