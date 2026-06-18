// Central model loader. Import order matters: models referenced by
// model('X') inside hooks must be registered before they are used.
'use strict';

const Island = require('./Island');
const Category = require('./Category');

const User = require('./User');
const Product = require('./Product');

const Address = require('./Address');
const Cart = require('./Cart');
const Coupon = require('./Coupon');
const Banner = require('./Banner');
const OtpLog = require('./OtpLog');
const Notification = require('./Notification');
const Wishlist = require('./Wishlist');

const Order = require('./Order');
const Review = require('./Review');

module.exports = {
  Island,
  Category,
  User,
  Product,
  Address,
  Cart,
  Coupon,
  Banner,
  OtpLog,
  Notification,
  Wishlist,
  Order,
  Review,
};
