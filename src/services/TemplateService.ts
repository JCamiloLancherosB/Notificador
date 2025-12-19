import { NotificationTemplate, TemplateType, NotificationChannel } from '../domain/types';

export class TemplateService {
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.initializeBuiltInTemplates();
  }

  private initializeBuiltInTemplates() {
    const builtInTemplates: NotificationTemplate[] = [
      // Order Confirmation Templates
      {
        id: 'order-confirm-email',
        name: 'Order Confirmation Email',
        type: 'order_confirmation',
        channel: 'email',
        subject: 'Order Confirmation - {{orderId}}',
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .order-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
    .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hi {{customerName}},</p>
      <p>Thank you for your order! We're excited to confirm that we've received your order and it's being processed.</p>
      <div class="order-details">
        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> {{orderId}}</p>
        <p><strong>Order Date:</strong> {{orderDate}}</p>
        <p><strong>Total Amount:</strong> {{totalAmount}}</p>
      </div>
      <p>You can track your order status at any time by clicking the button below:</p>
      <a href="{{trackingUrl}}" class="button">Track Your Order</a>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Thank you for shopping with us!</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 Techaura. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
        `.trim(),
        variables: [
          { name: 'customerName', description: 'Customer full name', required: true },
          { name: 'orderId', description: 'Order ID', required: true },
          { name: 'orderDate', description: 'Order date', required: true },
          { name: 'totalAmount', description: 'Total order amount', required: true },
          { name: 'trackingUrl', description: 'Order tracking URL', required: true },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'order-confirm-whatsapp',
        name: 'Order Confirmation WhatsApp',
        type: 'order_confirmation',
        channel: 'whatsapp',
        body: `🎉 *Order Confirmed!*

Hi {{customerName}},

Thank you for your order! 

📦 *Order Details:*
• Order ID: {{orderId}}
• Date: {{orderDate}}
• Total: {{totalAmount}}

Track your order: {{trackingUrl}}

Questions? Just reply to this message!

_Techaura Team_`,
        variables: [
          { name: 'customerName', description: 'Customer full name', required: true },
          { name: 'orderId', description: 'Order ID', required: true },
          { name: 'orderDate', description: 'Order date', required: true },
          { name: 'totalAmount', description: 'Total order amount', required: true },
          { name: 'trackingUrl', description: 'Order tracking URL', required: true },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'order-confirm-sms',
        name: 'Order Confirmation SMS',
        type: 'order_confirmation',
        channel: 'sms',
        body: 'Hi {{customerName}}! Your order {{orderId}} is confirmed. Total: {{totalAmount}}. Track it: {{trackingUrl}}',
        variables: [
          { name: 'customerName', description: 'Customer full name', required: true },
          { name: 'orderId', description: 'Order ID', required: true },
          { name: 'totalAmount', description: 'Total order amount', required: true },
          { name: 'trackingUrl', description: 'Order tracking URL', required: true },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Delivery Update Templates
      {
        id: 'delivery-update-email',
        name: 'Delivery Update Email',
        type: 'delivery_update',
        channel: 'email',
        subject: 'Your Order {{orderId}} is {{deliveryStatus}}',
        body: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Delivery Update</h2>
    <p>Hi {{customerName}},</p>
    <p>Your order <strong>{{orderId}}</strong> is currently: <strong>{{deliveryStatus}}</strong></p>
    <p>{{deliveryMessage}}</p>
    <p>Estimated delivery: {{estimatedDelivery}}</p>
    <p>Track your package: <a href="{{trackingUrl}}">{{trackingUrl}}</a></p>
    <p>Best regards,<br>Techaura Team</p>
  </div>
</body>
</html>
        `.trim(),
        variables: [
          { name: 'customerName', description: 'Customer full name', required: true },
          { name: 'orderId', description: 'Order ID', required: true },
          { name: 'deliveryStatus', description: 'Current delivery status', required: true },
          { name: 'deliveryMessage', description: 'Additional delivery message', required: false },
          { name: 'estimatedDelivery', description: 'Estimated delivery date', required: true },
          { name: 'trackingUrl', description: 'Tracking URL', required: true },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'delivery-update-whatsapp',
        name: 'Delivery Update WhatsApp',
        type: 'delivery_update',
        channel: 'whatsapp',
        body: `📦 *Delivery Update*

Hi {{customerName}}!

Your order {{orderId}} is: *{{deliveryStatus}}*

{{deliveryMessage}}

📅 Estimated delivery: {{estimatedDelivery}}

Track: {{trackingUrl}}`,
        variables: [
          { name: 'customerName', description: 'Customer full name', required: true },
          { name: 'orderId', description: 'Order ID', required: true },
          { name: 'deliveryStatus', description: 'Current delivery status', required: true },
          { name: 'deliveryMessage', description: 'Additional delivery message', required: false, defaultValue: '' },
          { name: 'estimatedDelivery', description: 'Estimated delivery date', required: true },
          { name: 'trackingUrl', description: 'Tracking URL', required: true },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Abandoned Cart Templates
      {
        id: 'abandoned-cart-email',
        name: 'Abandoned Cart Email',
        type: 'abandoned_cart',
        channel: 'email',
        subject: 'You left items in your cart, {{customerName}}!',
        body: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
    <h2 style="color: #FF5722;">Don't Miss Out!</h2>
    <p>Hi {{customerName}},</p>
    <p>We noticed you left some great items in your cart. They're still waiting for you!</p>
    <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <p><strong>Cart Value:</strong> {{cartValue}}</p>
      <p>Complete your purchase now and use code <strong style="color: #FF5722;">{{discountCode}}</strong> for {{discountAmount}} off!</p>
    </div>
    <a href="{{cartUrl}}" style="display: inline-block; padding: 12px 24px; background: #FF5722; color: white; text-decoration: none; border-radius: 4px; margin: 15px 0;">Complete My Purchase</a>
    <p style="color: #666; font-size: 14px;">Hurry! Items in your cart are selling fast.</p>
  </div>
</body>
</html>
        `.trim(),
        variables: [
          { name: 'customerName', description: 'Customer full name', required: true },
          { name: 'cartValue', description: 'Total cart value', required: true },
          { name: 'discountCode', description: 'Discount code', required: true },
          { name: 'discountAmount', description: 'Discount amount', required: true },
          { name: 'cartUrl', description: 'Cart recovery URL', required: true },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Newsletter Template
      {
        id: 'newsletter-email',
        name: 'Newsletter Email',
        type: 'newsletter',
        channel: 'email',
        subject: '{{newsletterTitle}}',
        body: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #2196F3; color: white; padding: 30px; text-align: center;">
      <h1>{{newsletterTitle}}</h1>
    </div>
    <div style="padding: 30px; background: #f9f9f9;">
      <p>Hi {{customerName}},</p>
      {{content}}
      <a href="{{ctaUrl}}" style="display: inline-block; padding: 12px 24px; background: #2196F3; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">{{ctaText}}</a>
    </div>
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>You're receiving this because you subscribed to our newsletter.</p>
      <p><a href="{{unsubscribeUrl}}" style="color: #666;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
        `.trim(),
        variables: [
          { name: 'customerName', description: 'Customer full name', required: true },
          { name: 'newsletterTitle', description: 'Newsletter title', required: true },
          { name: 'content', description: 'Newsletter HTML content', required: true },
          { name: 'ctaUrl', description: 'Call-to-action URL', required: true },
          { name: 'ctaText', description: 'Call-to-action button text', required: true },
          { name: 'unsubscribeUrl', description: 'Unsubscribe URL', required: true },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Promo Templates
      {
        id: 'promo-email',
        name: 'Promo Email',
        type: 'promo',
        channel: 'email',
        subject: '{{promoTitle}} - Special Offer Inside!',
        body: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 32px;">{{promoTitle}}</h1>
      <p style="font-size: 18px; margin: 10px 0;">{{promoSubtitle}}</p>
    </div>
    <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
      <p>Hi {{customerName}},</p>
      <p style="font-size: 16px;">{{promoDescription}}</p>
      <div style="background: white; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; border: 2px dashed #667eea;">
        <p style="font-size: 14px; margin: 5px 0;">Use code:</p>
        <p style="font-size: 28px; font-weight: bold; color: #667eea; margin: 5px 0; letter-spacing: 2px;">{{discountCode}}</p>
        <p style="font-size: 18px; color: #764ba2; margin: 5px 0;">Save {{discountAmount}}!</p>
      </div>
      <p style="text-align: center;">
        <a href="{{shopUrl}}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">Shop Now</a>
      </p>
      <p style="color: #666; font-size: 14px; text-align: center;">Offer expires: {{expiryDate}}</p>
    </div>
  </div>
</body>
</html>
        `.trim(),
        variables: [
          { name: 'customerName', description: 'Customer full name', required: true },
          { name: 'promoTitle', description: 'Promotion title', required: true },
          { name: 'promoSubtitle', description: 'Promotion subtitle', required: false, defaultValue: '' },
          { name: 'promoDescription', description: 'Promotion description', required: true },
          { name: 'discountCode', description: 'Discount code', required: true },
          { name: 'discountAmount', description: 'Discount amount/percentage', required: true },
          { name: 'shopUrl', description: 'Shop URL', required: true },
          { name: 'expiryDate', description: 'Offer expiry date', required: true },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'promo-whatsapp',
        name: 'Promo WhatsApp',
        type: 'promo',
        channel: 'whatsapp',
        body: `🎉 *{{promoTitle}}*

Hi {{customerName}}!

{{promoDescription}}

💰 Use code: *{{discountCode}}*
Save {{discountAmount}}!

Shop now: {{shopUrl}}

⏰ Expires: {{expiryDate}}

Don't miss out!`,
        variables: [
          { name: 'customerName', description: 'Customer full name', required: true },
          { name: 'promoTitle', description: 'Promotion title', required: true },
          { name: 'promoDescription', description: 'Promotion description', required: true },
          { name: 'discountCode', description: 'Discount code', required: true },
          { name: 'discountAmount', description: 'Discount amount/percentage', required: true },
          { name: 'shopUrl', description: 'Shop URL', required: true },
          { name: 'expiryDate', description: 'Offer expiry date', required: true },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'promo-sms',
        name: 'Promo SMS',
        type: 'promo',
        channel: 'sms',
        body: '{{promoTitle}}! Use {{discountCode}} to save {{discountAmount}}. Shop: {{shopUrl}} Expires: {{expiryDate}}',
        variables: [
          { name: 'promoTitle', description: 'Promotion title', required: true },
          { name: 'discountCode', description: 'Discount code', required: true },
          { name: 'discountAmount', description: 'Discount amount/percentage', required: true },
          { name: 'shopUrl', description: 'Shop URL', required: true },
          { name: 'expiryDate', description: 'Offer expiry date', required: true },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Password Reset Template
      {
        id: 'password-reset-email',
        name: 'Password Reset Email',
        type: 'password_reset',
        channel: 'email',
        subject: 'Reset Your Password',
        body: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Password Reset Request</h2>
    <p>Hi {{customerName}},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{resetUrl}}" style="display: inline-block; padding: 12px 24px; background: #f44336; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
    </p>
    <p>This link will expire in {{expiryMinutes}} minutes.</p>
    <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
    <p>Best regards,<br>Techaura Security Team</p>
  </div>
</body>
</html>
        `.trim(),
        variables: [
          { name: 'customerName', description: 'Customer full name', required: true },
          { name: 'resetUrl', description: 'Password reset URL', required: true },
          { name: 'expiryMinutes', description: 'Link expiry time in minutes', required: true },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Payment Receipt Template
      {
        id: 'payment-receipt-email',
        name: 'Payment Receipt Email',
        type: 'payment_receipt',
        channel: 'email',
        subject: 'Payment Receipt - {{transactionId}}',
        body: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
      <h1>Payment Received</h1>
    </div>
    <div style="padding: 30px; background: #f9f9f9;">
      <p>Hi {{customerName}},</p>
      <p>Thank you for your payment. Here are the details:</p>
      <div style="background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4CAF50;">
        <p><strong>Transaction ID:</strong> {{transactionId}}</p>
        <p><strong>Amount Paid:</strong> {{amount}}</p>
        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
        <p><strong>Date:</strong> {{paymentDate}}</p>
        <p><strong>Description:</strong> {{description}}</p>
      </div>
      <p>A copy of this receipt has been sent to your email for your records.</p>
      <p>If you have any questions about this payment, please contact our support team.</p>
    </div>
  </div>
</body>
</html>
        `.trim(),
        variables: [
          { name: 'customerName', description: 'Customer full name', required: true },
          { name: 'transactionId', description: 'Transaction ID', required: true },
          { name: 'amount', description: 'Payment amount', required: true },
          { name: 'paymentMethod', description: 'Payment method used', required: true },
          { name: 'paymentDate', description: 'Payment date', required: true },
          { name: 'description', description: 'Payment description', required: true },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    builtInTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  getTemplate(id: string): NotificationTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByChannel(channel: NotificationChannel): NotificationTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.channel === channel);
  }

  getTemplatesByType(type: TemplateType): NotificationTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.type === type);
  }

  addTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  updateTemplate(id: string, updates: Partial<NotificationTemplate>): boolean {
    const template = this.templates.get(id);
    if (!template) return false;

    const updated = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };
    this.templates.set(id, updated);
    return true;
  }

  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  renderTemplate(templateId: string, variables: Record<string, string>): { subject?: string; body: string; missingVariables: string[] } {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Check for missing required variables
    const missingVariables: string[] = [];
    const providedVariables = { ...variables };

    template.variables.forEach(v => {
      if (v.required && !(v.name in variables)) {
        if (v.defaultValue !== undefined) {
          providedVariables[v.name] = v.defaultValue;
        } else {
          missingVariables.push(v.name);
        }
      } else if (!v.required && !(v.name in variables) && v.defaultValue !== undefined) {
        providedVariables[v.name] = v.defaultValue;
      }
    });

    // Render the template
    let renderedSubject = template.subject;
    let renderedBody = template.body;

    Object.entries(providedVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      if (renderedSubject) {
        renderedSubject = renderedSubject.replace(regex, value);
      }
      renderedBody = renderedBody.replace(regex, value);
    });

    return {
      subject: renderedSubject,
      body: renderedBody,
      missingVariables,
    };
  }
}

export default new TemplateService();
