const Joi = require('joi');

// Validation schemas
const schemas = {
  sendNotification: Joi.object({
    recipients: Joi.array().items(
      Joi.object({
        userId: Joi.string().required(),
        channels: Joi.object({
          whatsapp: Joi.string().pattern(/^\d{10,15}$/).optional(),
          sms: Joi.string().pattern(/^\d{10,15}$/).optional(),
          email: Joi.string().email().optional()
        }).required()
      })
    ).min(1).required(),
    templateName: Joi.string().required(),
    variables: Joi.object().required(),
    channels: Joi.array().items(Joi.string().valid('whatsapp', 'sms', 'email')).min(1).required()
  }),

  scheduleNotification: Joi.object({
    recipients: Joi.array().items(
      Joi.object({
        userId: Joi.string().required(),
        channels: Joi.object({
          whatsapp: Joi.string().pattern(/^\d{10,15}$/).optional(),
          sms: Joi.string().pattern(/^\d{10,15}$/).optional(),
          email: Joi.string().email().optional()
        }).required()
      })
    ).min(1).required(),
    templateName: Joi.string().required(),
    variables: Joi.object().required(),
    channels: Joi.array().items(Joi.string().valid('whatsapp', 'sms', 'email')).min(1).required(),
    scheduledAt: Joi.date().iso().greater('now').required()
  }),

  createTemplate: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().optional(),
    channels: Joi.array().items(Joi.string().valid('whatsapp', 'sms', 'email')).min(1).required(),
    content_whatsapp: Joi.string().optional().allow(null),
    content_sms: Joi.string().optional().allow(null),
    content_email_subject: Joi.string().max(500).optional().allow(null),
    content_email_body: Joi.string().optional().allow(null),
    variables: Joi.array().items(Joi.string()).optional(),
    is_active: Joi.boolean().optional()
  }),

  updateSubscription: Joi.object({
    userId: Joi.string().required(),
    channel: Joi.string().valid('whatsapp', 'sms', 'email').required(),
    contact: Joi.string().required(),
    optedIn: Joi.boolean().required()
  })
};

// Validation functions
function validatePhone(phone) {
  // Remove non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Check if it's between 10-15 digits
  return /^\d{10,15}$/.test(cleaned);
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeInput(input) {
  if (typeof input === 'string') {
    // Remove potentially harmful characters and protocols
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/(javascript|data|vbscript):/gi, '') // Remove dangerous protocols
      .replace(/on\w+\s*=/gi, '') // Remove inline event handlers with whitespace
      .trim();
  }
  return input;
}

function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
}

function validateRequest(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => detail.message);
    throw new Error(`Validation error: ${errors.join(', ')}`);
  }
  return value;
}

module.exports = {
  schemas,
  validatePhone,
  validateEmail,
  sanitizeInput,
  sanitizeObject,
  validateRequest
};
