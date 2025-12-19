const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs').promises;

class Database {
  constructor() {
    this.connection = null;
    this.useInMemory = process.env.USE_IN_MEMORY === 'true';
    this.inMemoryData = {
      templates: [],
      subscriptions: [],
      notifications: []
    };
    this.nextIds = {
      templates: 1,
      subscriptions: 1,
      notifications: 1
    };
  }

  async connect() {
    if (this.useInMemory) {
      console.log('Using in-memory storage');
      await this.loadBuiltInTemplates();
      return;
    }

    try {
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'techaura',
        multipleStatements: true
      });
      console.log('Connected to MySQL database');
    } catch (error) {
      console.error('MySQL connection failed, falling back to in-memory storage:', error.message);
      this.useInMemory = true;
      await this.loadBuiltInTemplates();
    }
  }

  async loadBuiltInTemplates() {
    // Built-in templates for in-memory mode
    const templates = [
      {
        id: 1,
        name: 'order_confirmation',
        description: 'Order confirmation notification',
        channels: ['whatsapp', 'sms', 'email'],
        content_whatsapp: '¡Hola {{customerName}}! 🎉\n\nTu pedido #{{orderId}} ha sido confirmado.\n\nGracias por tu compra en Techaura.\n\n{{supportUrl}}',
        content_sms: 'Hola {{customerName}}! Tu pedido #{{orderId}} ha sido confirmado. Gracias por tu compra.',
        content_email_subject: 'Confirmación de Pedido #{{orderId}} - Techaura',
        content_email_body: '<html><body><h2>¡Pedido Confirmado!</h2><p>Hola {{customerName}},</p><p>Tu pedido <strong>#{{orderId}}</strong> ha sido confirmado y está siendo procesado.</p><p>Gracias por confiar en Techaura.</p><p><a href="{{supportUrl}}">Soporte</a></p></body></html>',
        variables: ['customerName', 'orderId', 'supportUrl'],
        is_active: true
      },
      {
        id: 2,
        name: 'payment_confirmation',
        description: 'Payment received confirmation',
        channels: ['whatsapp', 'sms', 'email'],
        content_whatsapp: '¡Hola {{customerName}}! 💳\n\nTu pago de ${{amount}} ha sido recibido.\n\nPedido: #{{orderId}}\n\nGracias por tu confianza.',
        content_sms: 'Pago recibido: ${{amount}} para pedido #{{orderId}}. Gracias!',
        content_email_subject: 'Pago Confirmado - Pedido #{{orderId}}',
        content_email_body: '<html><body><h2>Pago Recibido</h2><p>Hola {{customerName}},</p><p>Hemos recibido tu pago de <strong>${{amount}}</strong> para el pedido #{{orderId}}.</p><p>Gracias por tu confianza.</p></body></html>',
        variables: ['customerName', 'orderId', 'amount'],
        is_active: true
      },
      {
        id: 3,
        name: 'order_preparing',
        description: 'Order is being prepared',
        channels: ['whatsapp', 'sms', 'email'],
        content_whatsapp: 'Hola {{customerName}}! 👨‍🍳\n\nTu pedido #{{orderId}} está en preparación.\n\nEstado: {{status}}\n\nTiempo estimado: {{deliveryTime}}',
        content_sms: 'Tu pedido #{{orderId}} está en preparación. Tiempo estimado: {{deliveryTime}}',
        content_email_subject: 'Tu pedido está en preparación - #{{orderId}}',
        content_email_body: '<html><body><h2>Pedido en Preparación</h2><p>Hola {{customerName}},</p><p>Tu pedido <strong>#{{orderId}}</strong> está siendo preparado.</p><p>Estado: {{status}}</p><p>Tiempo estimado: {{deliveryTime}}</p></body></html>',
        variables: ['customerName', 'orderId', 'status', 'deliveryTime'],
        is_active: true
      },
      {
        id: 4,
        name: 'order_on_the_way',
        description: 'Order is on the way',
        channels: ['whatsapp', 'sms', 'email'],
        content_whatsapp: 'Hola {{customerName}}! 🚚\n\nTu pedido #{{orderId}} está en camino.\n\nLlegada estimada: {{deliveryTime}}',
        content_sms: 'Tu pedido #{{orderId}} está en camino. Llegada: {{deliveryTime}}',
        content_email_subject: 'Tu pedido viene en camino - #{{orderId}}',
        content_email_body: '<html><body><h2>Pedido en Camino</h2><p>Hola {{customerName}},</p><p>Tu pedido <strong>#{{orderId}}</strong> está en camino.</p><p>Llegada estimada: {{deliveryTime}}</p></body></html>',
        variables: ['customerName', 'orderId', 'deliveryTime'],
        is_active: true
      },
      {
        id: 5,
        name: 'order_delivered',
        description: 'Order has been delivered',
        channels: ['whatsapp', 'sms', 'email'],
        content_whatsapp: '¡Hola {{customerName}}! ✅\n\nTu pedido #{{orderId}} ha sido entregado.\n\n¡Disfruta tu compra!\n\n{{supportUrl}}',
        content_sms: 'Tu pedido #{{orderId}} ha sido entregado. Disfruta!',
        content_email_subject: 'Pedido Entregado - #{{orderId}}',
        content_email_body: '<html><body><h2>Pedido Entregado</h2><p>Hola {{customerName}},</p><p>Tu pedido <strong>#{{orderId}}</strong> ha sido entregado exitosamente.</p><p>¡Disfruta tu compra!</p><p><a href="{{supportUrl}}">¿Necesitas ayuda?</a></p></body></html>',
        variables: ['customerName', 'orderId', 'supportUrl'],
        is_active: true
      },
      {
        id: 6,
        name: 'password_reset',
        description: 'Password reset request',
        channels: ['email', 'sms'],
        content_whatsapp: null,
        content_sms: 'Código de recuperación: {{resetCode}}. Válido por 30 minutos.',
        content_email_subject: 'Recuperación de Contraseña - Techaura',
        content_email_body: '<html><body><h2>Recuperación de Contraseña</h2><p>Hola {{customerName}},</p><p>Recibimos una solicitud para restablecer tu contraseña.</p><p><a href="{{ctaUrl}}" style="background:#4CAF50;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Restablecer Contraseña</a></p><p>O usa este código: <strong>{{resetCode}}</strong></p><p>Este enlace expira en 30 minutos.</p><p>Si no solicitaste esto, ignora este mensaje.</p></body></html>',
        variables: ['customerName', 'ctaUrl', 'resetCode'],
        is_active: true
      },
      {
        id: 7,
        name: 'payment_receipt',
        description: 'Payment receipt',
        channels: ['email'],
        content_whatsapp: null,
        content_sms: null,
        content_email_subject: 'Recibo de Pago - Techaura',
        content_email_body: '<html><body><h2>Recibo de Pago</h2><p>Hola {{customerName}},</p><p>Gracias por tu pago de <strong>${{amount}}</strong>.</p><p>Pedido: #{{orderId}}</p><p>Fecha: {{paymentDate}}</p><p>Este es tu recibo oficial.</p></body></html>',
        variables: ['customerName', 'orderId', 'amount', 'paymentDate'],
        is_active: true
      },
      {
        id: 8,
        name: 'abandoned_cart',
        description: 'Abandoned cart reminder',
        channels: ['whatsapp', 'email'],
        content_whatsapp: 'Hola {{customerName}}! 🛒\n\nDejaste productos en tu carrito.\n\n¡Usa el código {{discountCode}} para 10% de descuento!\n\n{{ctaUrl}}',
        content_sms: null,
        content_email_subject: 'No olvides tu carrito - ¡10% de descuento!',
        content_email_body: '<html><body><h2>¡Vuelve y ahorra!</h2><p>Hola {{customerName}},</p><p>Notamos que dejaste productos en tu carrito.</p><p><strong>¡Usa el código {{discountCode}} para obtener 10% de descuento!</strong></p><p><a href="{{ctaUrl}}" style="background:#FF5722;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Completar Compra</a></p></body></html>',
        variables: ['customerName', 'discountCode', 'ctaUrl'],
        is_active: true
      },
      {
        id: 9,
        name: 'newsletter',
        description: 'Newsletter/promotional email',
        channels: ['email', 'whatsapp'],
        content_whatsapp: '¡Hola! 📢\n\n{{messageContent}}\n\n{{ctaUrl}}',
        content_sms: null,
        content_email_subject: '{{subject}}',
        content_email_body: '<html><body><h2>{{subject}}</h2><div>{{messageContent}}</div><p><a href="{{ctaUrl}}" style="background:#2196F3;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Más Información</a></p><p style="font-size:12px;color:#666;">Para darse de baja, <a href="{{unsubscribeUrl}}">haz clic aquí</a></p></body></html>',
        variables: ['subject', 'messageContent', 'ctaUrl', 'unsubscribeUrl'],
        is_active: true
      }
    ];

    this.inMemoryData.templates = templates;
    this.nextIds.templates = templates.length + 1;
  }

  async query(sql, params) {
    if (this.useInMemory) {
      return this.executeInMemoryQuery(sql, params);
    }
    const [results] = await this.connection.execute(sql, params);
    return results;
  }

  executeInMemoryQuery(sql, params = []) {
    // Basic in-memory query execution (simplified)
    const sqlLower = sql.toLowerCase().trim();
    
    if (sqlLower.startsWith('select')) {
      return this.handleSelect(sql, params);
    } else if (sqlLower.startsWith('insert')) {
      return this.handleInsert(sql, params);
    } else if (sqlLower.startsWith('update')) {
      return this.handleUpdate(sql, params);
    } else if (sqlLower.startsWith('delete')) {
      return this.handleDelete(sql, params);
    }
    
    return [];
  }

  handleSelect(sql, params) {
    const sqlLower = sql.toLowerCase();
    
    if (sqlLower.includes('from templates')) {
      let results = [...this.inMemoryData.templates];
      
      if (sqlLower.includes('where id = ?') && params.length > 0) {
        results = results.filter(t => t.id === params[0]);
      } else if (sqlLower.includes('where name = ?') && params.length > 0) {
        results = results.filter(t => t.name === params[0]);
      } else if (sqlLower.includes('where is_active = true')) {
        results = results.filter(t => t.is_active);
      }
      
      return results;
    } else if (sqlLower.includes('from subscriptions')) {
      let results = [...this.inMemoryData.subscriptions];
      
      if (sqlLower.includes('where user_id = ? and channel = ?') && params.length >= 2) {
        results = results.filter(s => s.user_id === params[0] && s.channel === params[1]);
      } else if (sqlLower.includes('where user_id = ?') && params.length >= 1) {
        results = results.filter(s => s.user_id === params[0]);
      }
      
      return results;
    } else if (sqlLower.includes('from notifications')) {
      let results = [...this.inMemoryData.notifications];
      
      // Apply filters based on query
      if (sqlLower.includes('where status = ? and scheduled_at <= ?') && params.length >= 2) {
        results = results.filter(n => n.status === params[0] && new Date(n.scheduled_at) <= params[1]);
      } else {
        // Simple filtering for other queries
        let paramIndex = 0;
        if (sqlLower.includes('channel = ?') && params.length > paramIndex) {
          results = results.filter(n => n.channel === params[paramIndex++]);
        }
        if (sqlLower.includes('status = ?') && params.length > paramIndex) {
          results = results.filter(n => n.status === params[paramIndex++]);
        }
      }
      
      // Sort by created_at descending
      results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      return results;
    }
    
    return [];
  }

  handleInsert(sql, params) {
    const sqlLower = sql.toLowerCase();
    const now = new Date().toISOString();
    
    if (sqlLower.includes('into templates')) {
      const id = this.nextIds.templates++;
      const template = {
        id,
        name: params[0],
        description: params[1],
        channels: JSON.parse(params[2]),
        content_whatsapp: params[3],
        content_sms: params[4],
        content_email_subject: params[5],
        content_email_body: params[6],
        variables: JSON.parse(params[7]),
        is_active: params[8] !== undefined ? params[8] : true,
        created_at: now,
        updated_at: now
      };
      this.inMemoryData.templates.push(template);
      return { insertId: id };
    } else if (sqlLower.includes('into subscriptions')) {
      const id = this.nextIds.subscriptions++;
      const subscription = {
        id,
        user_id: params[0],
        channel: params[1],
        contact: params[2],
        opted_in: params[3] !== undefined ? params[3] : true,
        opted_in_at: params[3] ? now : null,
        opted_out_at: params[3] ? null : now,
        created_at: now,
        updated_at: now
      };
      this.inMemoryData.subscriptions.push(subscription);
      return { insertId: id };
    } else if (sqlLower.includes('into notifications')) {
      const id = this.nextIds.notifications++;
      const notification = {
        id,
        recipient_id: params[0],
        channel: params[1],
        template_id: params[2],
        template_name: params[3],
        recipient_contact: params[4],
        message_content: params[5],
        variables: params[6],
        status: params[7] || 'pending',
        scheduled_at: params[8] || null,
        sent_at: null,
        failed_at: null,
        error_message: null,
        retry_count: 0,
        provider_response: null,
        created_at: now,
        updated_at: now
      };
      this.inMemoryData.notifications.push(notification);
      return { insertId: id };
    }
    
    return { insertId: 0 };
  }

  handleUpdate(sql, params) {
    const sqlLower = sql.toLowerCase();
    const now = new Date().toISOString();
    
    if (sqlLower.includes('update templates')) {
      const id = params[params.length - 1];
      const template = this.inMemoryData.templates.find(t => t.id === id);
      if (template) {
        template.name = params[0];
        template.description = params[1];
        template.channels = JSON.parse(params[2]);
        template.content_whatsapp = params[3];
        template.content_sms = params[4];
        template.content_email_subject = params[5];
        template.content_email_body = params[6];
        template.variables = JSON.parse(params[7]);
        template.is_active = params[8];
        template.updated_at = now;
        return { affectedRows: 1 };
      }
    } else if (sqlLower.includes('update subscriptions')) {
      const subscription = this.inMemoryData.subscriptions.find(s => 
        s.user_id === params[2] && s.channel === params[3]
      );
      if (subscription) {
        subscription.opted_in = params[0];
        subscription.contact = params[1];
        if (params[0]) {
          subscription.opted_in_at = now;
          subscription.opted_out_at = null;
        } else {
          subscription.opted_out_at = now;
        }
        subscription.updated_at = now;
        return { affectedRows: 1 };
      }
    } else if (sqlLower.includes('update notifications')) {
      const id = params[params.length - 1];
      const notification = this.inMemoryData.notifications.find(n => n.id === id);
      if (notification) {
        notification.status = params[0];
        notification.sent_at = params[1];
        notification.failed_at = params[2];
        notification.error_message = params[3];
        notification.retry_count = params[4];
        notification.provider_response = params[5];
        notification.updated_at = now;
        return { affectedRows: 1 };
      }
    }
    
    return { affectedRows: 0 };
  }

  handleDelete(sql, params) {
    const sqlLower = sql.toLowerCase();
    
    if (sqlLower.includes('from templates')) {
      const initialLength = this.inMemoryData.templates.length;
      this.inMemoryData.templates = this.inMemoryData.templates.filter(t => t.id !== params[0]);
      return { affectedRows: initialLength - this.inMemoryData.templates.length };
    }
    
    return { affectedRows: 0 };
  }

  async close() {
    if (this.connection && !this.useInMemory) {
      await this.connection.end();
    }
  }
}

module.exports = new Database();
