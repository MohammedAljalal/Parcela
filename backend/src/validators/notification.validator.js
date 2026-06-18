// Validation rules for listing notifications.
import Joi from 'joi';

const listNotificationsQuerySchema = Joi.object({
  isRead: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
});

export { listNotificationsQuerySchema };

