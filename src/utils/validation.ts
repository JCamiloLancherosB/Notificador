import Joi from 'joi';

export const recipientSchema = Joi.object({
  id: Joi.string().optional(),
  name: Joi.string().required().min(1).max(255),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional().allow(null, ''),
  whatsappNumber: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional().allow(null, ''),
  optIns: Joi.object({
    email: Joi.boolean().required(),
    sms: Joi.boolean().required(),
    whatsapp: Joi.boolean().required(),
  }).required(),
});

export const notificationRequestSchema = Joi.object({
  templateId: Joi.string().required(),
  channels: Joi.array().items(Joi.string().valid('email', 'sms', 'whatsapp')).min(1).required(),
  recipient: recipientSchema.required(),
  variables: Joi.object().pattern(Joi.string(), Joi.string()).required(),
  scheduledFor: Joi.date().optional(),
  priority: Joi.string().valid('low', 'normal', 'high').optional(),
});

export const bulkNotificationRequestSchema = Joi.object({
  templateId: Joi.string().required(),
  channels: Joi.array().items(Joi.string().valid('email', 'sms', 'whatsapp')).min(1).required(),
  recipients: Joi.array().items(recipientSchema).min(1).required(),
  variables: Joi.object().pattern(Joi.string(), Joi.string()).required(),
  scheduledFor: Joi.date().optional(),
  priority: Joi.string().valid('low', 'normal', 'high').optional(),
});

export const optInUpdateSchema = Joi.object({
  email: Joi.boolean().optional(),
  sms: Joi.boolean().optional(),
  whatsapp: Joi.boolean().optional(),
}).min(1);

export const analyticsFilterSchema = Joi.object({
  channel: Joi.string().valid('email', 'sms', 'whatsapp').optional(),
  status: Joi.string().valid('pending', 'queued', 'sent', 'delivered', 'failed', 'cancelled').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  templateId: Joi.string().optional(),
  recipientId: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(10000).optional(),
});

export function validateRequest<T>(schema: Joi.ObjectSchema<T>, data: unknown): { value: T; error?: string } {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const errorMessage = error.details.map(d => d.message).join(', ');
    return { value: value as T, error: errorMessage };
  }
  
  return { value: value as T };
}

export function sanitizeString(input: string): string {
  // Remove potential XSS vectors
  return input
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 10000); // Max length
}

export function sanitizeObject(obj: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  Object.entries(obj).forEach(([key, value]) => {
    sanitized[sanitizeString(key)] = sanitizeString(value);
  });
  return sanitized;
}
