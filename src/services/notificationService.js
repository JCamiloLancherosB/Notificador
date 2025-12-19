const db = require('../utils/database');
const templateService = require('./templateService');
const subscriptionService = require('./subscriptionService');
const twilioAdapter = require('../adapters/twilioAdapter');
const emailAdapter = require('../adapters/emailAdapter');
const { validatePhone, validateEmail } = require('../utils/validation');

class NotificationService {
  async sendNotification(recipients, templateName, variables, channels) {
    const template = await templateService.getTemplateByName(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Validate template variables
    templateService.validateTemplateVariables(template, variables);

    const results = [];

    for (const recipient of recipients) {
      for (const channel of channels) {
        // Check if template supports this channel
        if (!template.channels.includes(channel)) {
          results.push({
            recipientId: recipient.userId,
            channel,
            status: 'skipped',
            reason: `Template does not support ${channel}`
          });
          continue;
        }

        // Get contact for this channel
        const contact = recipient.channels[channel];
        if (!contact) {
          results.push({
            recipientId: recipient.userId,
            channel,
            status: 'skipped',
            reason: `No ${channel} contact provided`
          });
          continue;
        }

        // Validate contact
        if (channel === 'email' && !validateEmail(contact)) {
          results.push({
            recipientId: recipient.userId,
            channel,
            status: 'failed',
            reason: 'Invalid email address'
          });
          continue;
        }

        if ((channel === 'whatsapp' || channel === 'sms') && !validatePhone(contact)) {
          results.push({
            recipientId: recipient.userId,
            channel,
            status: 'failed',
            reason: 'Invalid phone number'
          });
          continue;
        }

        // Check opt-in status
        const isOptedIn = await subscriptionService.checkOptIn(recipient.userId, channel, contact);
        if (!isOptedIn) {
          results.push({
            recipientId: recipient.userId,
            channel,
            status: 'skipped',
            reason: 'User opted out'
          });
          continue;
        }

        // Render template
        const content = templateService.renderTemplate(template, channel, variables);

        // Create notification record
        const notificationId = await this.createNotificationRecord(
          recipient.userId,
          channel,
          template.id,
          template.name,
          contact,
          channel === 'email' ? JSON.stringify(content) : content,
          variables,
          'pending'
        );

        // Send notification
        const sendResult = await this.dispatchNotification(channel, contact, content);

        // Update notification record
        await this.updateNotificationRecord(
          notificationId,
          sendResult.success ? 'sent' : 'failed',
          sendResult
        );

        results.push({
          recipientId: recipient.userId,
          channel,
          status: sendResult.success ? 'sent' : 'failed',
          notificationId,
          ...sendResult
        });
      }
    }

    return results;
  }

  async scheduleNotification(recipients, templateName, variables, channels, scheduledAt) {
    const template = await templateService.getTemplateByName(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Validate template variables
    templateService.validateTemplateVariables(template, variables);

    const results = [];

    for (const recipient of recipients) {
      for (const channel of channels) {
        // Check if template supports this channel
        if (!template.channels.includes(channel)) {
          continue;
        }

        const contact = recipient.channels[channel];
        if (!contact) {
          continue;
        }

        // Render template (for validation)
        const content = templateService.renderTemplate(template, channel, variables);

        // Create scheduled notification record
        const notificationId = await this.createNotificationRecord(
          recipient.userId,
          channel,
          template.id,
          template.name,
          contact,
          channel === 'email' ? JSON.stringify(content) : content,
          variables,
          'scheduled',
          scheduledAt
        );

        results.push({
          recipientId: recipient.userId,
          channel,
          status: 'scheduled',
          notificationId,
          scheduledAt
        });
      }
    }

    return results;
  }

  async dispatchNotification(channel, contact, content) {
    try {
      switch (channel) {
        case 'whatsapp':
          return await twilioAdapter.sendWithRetry('whatsapp', contact, content);
        case 'sms':
          return await twilioAdapter.sendWithRetry('sms', contact, content);
        case 'email':
          return await emailAdapter.sendWithRetry(contact, content.subject, content.body);
        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createNotificationRecord(recipientId, channel, templateId, templateName, 
                                   contact, content, variables, status, scheduledAt = null) {
    const result = await db.query(
      `INSERT INTO notifications 
       (recipient_id, channel, template_id, template_name, recipient_contact, 
        message_content, variables, status, scheduled_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recipientId,
        channel,
        templateId,
        templateName,
        contact,
        content,
        JSON.stringify(variables),
        status,
        scheduledAt
      ]
    );

    return result.insertId;
  }

  async updateNotificationRecord(id, status, result) {
    const now = new Date();
    const sentAt = status === 'sent' ? now : null;
    const failedAt = status === 'failed' ? now : null;

    await db.query(
      `UPDATE notifications 
       SET status = ?, sent_at = ?, failed_at = ?, error_message = ?, 
           retry_count = ?, provider_response = ? 
       WHERE id = ?`,
      [
        status,
        sentAt,
        failedAt,
        result.error || null,
        result.retries || 0,
        JSON.stringify(result),
        id
      ]
    );
  }

  async getHistory(filters = {}) {
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];

    if (filters.channel) {
      query += ' AND channel = ?';
      params.push(filters.channel);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.recipientId) {
      query += ' AND recipient_id = ?';
      params.push(filters.recipientId);
    }

    if (filters.templateName) {
      query += ' AND template_name = ?';
      params.push(filters.templateName);
    }

    if (filters.startDate) {
      query += ' AND created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND created_at <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    const notifications = await db.query(query, params);

    return notifications.map(n => ({
      id: n.id,
      recipientId: n.recipient_id,
      channel: n.channel,
      templateId: n.template_id,
      templateName: n.template_name,
      recipientContact: n.recipient_contact,
      messageContent: n.message_content,
      variables: typeof n.variables === 'string' ? JSON.parse(n.variables) : n.variables,
      status: n.status,
      scheduledAt: n.scheduled_at,
      sentAt: n.sent_at,
      failedAt: n.failed_at,
      errorMessage: n.error_message,
      retryCount: n.retry_count,
      providerResponse: typeof n.provider_response === 'string' ? JSON.parse(n.provider_response) : n.provider_response,
      createdAt: n.created_at,
      updatedAt: n.updated_at
    }));
  }

  async getAnalytics(startDate, endDate) {
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const notifications = await this.getHistory(filters);

    const analytics = {
      total: notifications.length,
      byStatus: {
        sent: 0,
        failed: 0,
        pending: 0,
        scheduled: 0
      },
      byChannel: {
        whatsapp: { total: 0, sent: 0, failed: 0 },
        sms: { total: 0, sent: 0, failed: 0 },
        email: { total: 0, sent: 0, failed: 0 }
      },
      byTemplate: {},
      recentActivity: notifications.slice(0, 10)
    };

    notifications.forEach(n => {
      // By status
      analytics.byStatus[n.status]++;

      // By channel
      analytics.byChannel[n.channel].total++;
      if (n.status === 'sent') {
        analytics.byChannel[n.channel].sent++;
      } else if (n.status === 'failed') {
        analytics.byChannel[n.channel].failed++;
      }

      // By template
      if (!analytics.byTemplate[n.templateName]) {
        analytics.byTemplate[n.templateName] = { total: 0, sent: 0, failed: 0 };
      }
      analytics.byTemplate[n.templateName].total++;
      if (n.status === 'sent') {
        analytics.byTemplate[n.templateName].sent++;
      } else if (n.status === 'failed') {
        analytics.byTemplate[n.templateName].failed++;
      }
    });

    return analytics;
  }

  async processScheduledNotifications() {
    const now = new Date();
    const scheduled = await db.query(
      'SELECT * FROM notifications WHERE status = ? AND scheduled_at <= ?',
      ['scheduled', now]
    );

    const results = [];

    for (const notification of scheduled) {
      const variables = typeof notification.variables === 'string' 
        ? JSON.parse(notification.variables) 
        : notification.variables;

      let content = notification.message_content;
      if (notification.channel === 'email') {
        content = JSON.parse(content);
      }

      const sendResult = await this.dispatchNotification(
        notification.channel,
        notification.recipient_contact,
        content
      );

      await this.updateNotificationRecord(
        notification.id,
        sendResult.success ? 'sent' : 'failed',
        sendResult
      );

      results.push({
        notificationId: notification.id,
        status: sendResult.success ? 'sent' : 'failed',
        ...sendResult
      });
    }

    return results;
  }
}

module.exports = new NotificationService();
