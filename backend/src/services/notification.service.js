// Centralized notification creation with bilingual templates.

import mongoose from 'mongoose';
import { NOTIFICATION_TYPE } from '../config/constants.js';

const TEMPLATES = {
  [NOTIFICATION_TYPE.ORDER_CONFIRMED]: (data) => ({
    title: { pt: 'Pedido confirmado', en: 'Order confirmed' },
    body: {
      pt: `O seu pedido #${data.orderNumber} foi confirmado com sucesso.`,
      en: `Your order #${data.orderNumber} has been confirmed.`,
    },
  }),
  [NOTIFICATION_TYPE.ORDER_STATUS_UPDATE]: (data) => ({
    title: { pt: 'Atualização do pedido', en: 'Order update' },
    body: {
      pt: `O seu pedido #${data.orderNumber} está agora "${data.statusLabel}".`,
      en: `Your order #${data.orderNumber} is now "${data.statusLabel}".`,
    },
  }),
  [NOTIFICATION_TYPE.ORDER_DELIVERED]: (data) => ({
    title: { pt: 'Pedido entregue', en: 'Order delivered' },
    body: {
      pt: `O seu pedido #${data.orderNumber} foi entregue.`,
      en: `Your order #${data.orderNumber} has been delivered.`,
    },
  }),
  [NOTIFICATION_TYPE.PAYMENT_REMINDER]: (data) => ({
    title: { pt: 'Pagamento pendente', en: 'Payment pending' },
    body: {
      pt: `O seu pedido #${data.orderNumber} aguarda pagamento.`,
      en: `Your order #${data.orderNumber} is awaiting payment.`,
    },
  }),
  [NOTIFICATION_TYPE.LOW_STOCK_WISHLIST]: (data) => ({
    title: { pt: 'Stock limitado', en: 'Low stock' },
    body: {
      pt: `O produto "${data.productName}" na sua lista de favoritos está quase esgotado.`,
      en: `"${data.productName}" in your wishlist is almost out of stock.`,
    },
  }),
  [NOTIFICATION_TYPE.PROMO]: (data) => ({ title: data.title, body: data.body }),
};

const createNotification = async ({ userId, type, data = {}, relatedOrder = null, relatedProduct = null }) => {
  const template = TEMPLATES[type];
  if (!template) throw new Error(`Unknown notification type: ${type}`);

  const { title, body } = template(data);

  // Use mongoose.model() to avoid circular dependency with models/index.js
  const Notification = mongoose.model('Notification');
  const notification = await Notification.create({ user: userId, type, title, body, data });

  await sendPushNotificationSafely(userId, title, body);

  return notification;
};

const createBulkNotification = async ({ userIds, type, data = {} }) => {
  const template = TEMPLATES[type];
  if (!template) throw new Error(`Unknown notification type: ${type}`);

  const { title, body } = template(data);

  const Notification = mongoose.model('Notification');
  const notifications = userIds.map((userId) => ({ user: userId, type, title, body, data }));
  await Notification.insertMany(notifications);
};

// Push failures must never break the calling operation.
const sendPushNotificationSafely = async (userId, title, body) => {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(userId).select('+fcmToken notificationsEnabled');

    if (!user || !user.fcmToken || !user.notificationsEnabled) return;

    // Production: call Firebase Admin SDK here.
    console.log(`[PUSH SIMULATED] To user ${userId}: ${title.pt}`);
  } catch (error) {
    console.error('Push notification failed:', error.message);
  }
};

export { createNotification, createBulkNotification };
