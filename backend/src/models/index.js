// Central model loader. Import order matters: models referenced by
// model('X') inside hooks must be registered before they are used.

import Island from './Island.js';
import Category from './Category.js';

import User from './User.js';
import Product from './Product.js';

import Address from './Address.js';
import Cart from './Cart.js';
import Coupon from './Coupon.js';
import Banner from './Banner.js';
import OtpLog from './OtpLog.js';
import Notification from './Notification.js';
import Wishlist from './Wishlist.js';

import Order from './Order.js';
import Review from './Review.js';

export {
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
