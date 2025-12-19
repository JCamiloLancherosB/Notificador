-- Techaura Notification Service Database Schema

CREATE DATABASE IF NOT EXISTS techaura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE techaura;

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  channels JSON NOT NULL COMMENT 'Array of supported channels: whatsapp, sms, email',
  content_whatsapp TEXT,
  content_sms TEXT,
  content_email_subject VARCHAR(500),
  content_email_body TEXT,
  variables JSON COMMENT 'Array of required variables',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL COMMENT 'whatsapp, sms, or email',
  contact VARCHAR(255) NOT NULL COMMENT 'Phone number or email',
  opted_in BOOLEAN DEFAULT TRUE,
  opted_in_at TIMESTAMP NULL,
  opted_out_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_subscription (user_id, channel, contact),
  INDEX idx_user_channel (user_id, channel),
  INDEX idx_opted_in (opted_in)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_id VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL COMMENT 'whatsapp, sms, or email',
  template_id INT,
  template_name VARCHAR(255),
  recipient_contact VARCHAR(255) NOT NULL,
  message_content TEXT,
  variables JSON COMMENT 'Variables used for rendering',
  status VARCHAR(50) NOT NULL COMMENT 'pending, sent, failed, scheduled',
  scheduled_at TIMESTAMP NULL,
  sent_at TIMESTAMP NULL,
  failed_at TIMESTAMP NULL,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  provider_response JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_channel (channel),
  INDEX idx_recipient (recipient_id),
  INDEX idx_scheduled (scheduled_at),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert built-in templates
INSERT INTO templates (name, description, channels, content_whatsapp, content_sms, content_email_subject, content_email_body, variables) VALUES
('order_confirmation', 'Order confirmation notification', '["whatsapp", "sms", "email"]', 
 '¡Hola {{customerName}}! 🎉\n\nTu pedido #{{orderId}} ha sido confirmado.\n\nGracias por tu compra en Techaura.\n\n{{supportUrl}}',
 'Hola {{customerName}}! Tu pedido #{{orderId}} ha sido confirmado. Gracias por tu compra.',
 'Confirmación de Pedido #{{orderId}} - Techaura',
 '<html><body><h2>¡Pedido Confirmado!</h2><p>Hola {{customerName}},</p><p>Tu pedido <strong>#{{orderId}}</strong> ha sido confirmado y está siendo procesado.</p><p>Gracias por confiar en Techaura.</p><p><a href="{{supportUrl}}">Soporte</a></p></body></html>',
 '["customerName", "orderId", "supportUrl"]'),

('payment_confirmation', 'Payment received confirmation', '["whatsapp", "sms", "email"]',
 '¡Hola {{customerName}}! 💳\n\nTu pago de ${{amount}} ha sido recibido.\n\nPedido: #{{orderId}}\n\nGracias por tu confianza.',
 'Pago recibido: ${{amount}} para pedido #{{orderId}}. Gracias!',
 'Pago Confirmado - Pedido #{{orderId}}',
 '<html><body><h2>Pago Recibido</h2><p>Hola {{customerName}},</p><p>Hemos recibido tu pago de <strong>${{amount}}</strong> para el pedido #{{orderId}}.</p><p>Gracias por tu confianza.</p></body></html>',
 '["customerName", "orderId", "amount"]'),

('order_preparing', 'Order is being prepared', '["whatsapp", "sms", "email"]',
 'Hola {{customerName}}! 👨‍🍳\n\nTu pedido #{{orderId}} está en preparación.\n\nEstado: {{status}}\n\nTiempo estimado: {{deliveryTime}}',
 'Tu pedido #{{orderId}} está en preparación. Tiempo estimado: {{deliveryTime}}',
 'Tu pedido está en preparación - #{{orderId}}',
 '<html><body><h2>Pedido en Preparación</h2><p>Hola {{customerName}},</p><p>Tu pedido <strong>#{{orderId}}</strong> está siendo preparado.</p><p>Estado: {{status}}</p><p>Tiempo estimado: {{deliveryTime}}</p></body></html>',
 '["customerName", "orderId", "status", "deliveryTime"]'),

('order_on_the_way', 'Order is on the way', '["whatsapp", "sms", "email"]',
 'Hola {{customerName}}! 🚚\n\nTu pedido #{{orderId}} está en camino.\n\nLlegada estimada: {{deliveryTime}}',
 'Tu pedido #{{orderId}} está en camino. Llegada: {{deliveryTime}}',
 'Tu pedido viene en camino - #{{orderId}}',
 '<html><body><h2>Pedido en Camino</h2><p>Hola {{customerName}},</p><p>Tu pedido <strong>#{{orderId}}</strong> está en camino.</p><p>Llegada estimada: {{deliveryTime}}</p></body></html>',
 '["customerName", "orderId", "deliveryTime"]'),

('order_delivered', 'Order has been delivered', '["whatsapp", "sms", "email"]',
 '¡Hola {{customerName}}! ✅\n\nTu pedido #{{orderId}} ha sido entregado.\n\n¡Disfruta tu compra!\n\n{{supportUrl}}',
 'Tu pedido #{{orderId}} ha sido entregado. Disfruta!',
 'Pedido Entregado - #{{orderId}}',
 '<html><body><h2>Pedido Entregado</h2><p>Hola {{customerName}},</p><p>Tu pedido <strong>#{{orderId}}</strong> ha sido entregado exitosamente.</p><p>¡Disfruta tu compra!</p><p><a href="{{supportUrl}}">¿Necesitas ayuda?</a></p></body></html>',
 '["customerName", "orderId", "supportUrl"]'),

('password_reset', 'Password reset request', '["email", "sms"]',
 NULL,
 'Código de recuperación: {{resetCode}}. Válido por 30 minutos.',
 'Recuperación de Contraseña - Techaura',
 '<html><body><h2>Recuperación de Contraseña</h2><p>Hola {{customerName}},</p><p>Recibimos una solicitud para restablecer tu contraseña.</p><p><a href="{{ctaUrl}}" style="background:#4CAF50;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Restablecer Contraseña</a></p><p>O usa este código: <strong>{{resetCode}}</strong></p><p>Este enlace expira en 30 minutos.</p><p>Si no solicitaste esto, ignora este mensaje.</p></body></html>',
 '["customerName", "ctaUrl", "resetCode"]'),

('payment_receipt', 'Payment receipt', '["email"]',
 NULL,
 NULL,
 'Recibo de Pago - Techaura',
 '<html><body><h2>Recibo de Pago</h2><p>Hola {{customerName}},</p><p>Gracias por tu pago de <strong>${{amount}}</strong>.</p><p>Pedido: #{{orderId}}</p><p>Fecha: {{paymentDate}}</p><p>Este es tu recibo oficial.</p></body></html>',
 '["customerName", "orderId", "amount", "paymentDate"]'),

('abandoned_cart', 'Abandoned cart reminder', '["whatsapp", "email"]',
 'Hola {{customerName}}! 🛒\n\nDejaste productos en tu carrito.\n\n¡Usa el código {{discountCode}} para 10% de descuento!\n\n{{ctaUrl}}',
 NULL,
 'No olvides tu carrito - ¡10% de descuento!',
 '<html><body><h2>¡Vuelve y ahorra!</h2><p>Hola {{customerName}},</p><p>Notamos que dejaste productos en tu carrito.</p><p><strong>¡Usa el código {{discountCode}} para obtener 10% de descuento!</strong></p><p><a href="{{ctaUrl}}" style="background:#FF5722;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Completar Compra</a></p></body></html>',
 '["customerName", "discountCode", "ctaUrl"]'),

('newsletter', 'Newsletter/promotional email', '["email", "whatsapp"]',
 '¡Hola! 📢\n\n{{messageContent}}\n\n{{ctaUrl}}',
 NULL,
 '{{subject}}',
 '<html><body><h2>{{subject}}</h2><div>{{messageContent}}</div><p><a href="{{ctaUrl}}" style="background:#2196F3;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Más Información</a></p><p style="font-size:12px;color:#666;">Para darse de baja, <a href="{{unsubscribeUrl}}">haz clic aquí</a></p></body></html>',
 '["subject", "messageContent", "ctaUrl", "unsubscribeUrl"]');
