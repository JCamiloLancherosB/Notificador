const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

class EmailAdapter {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'sendgrid';
    this.isConfigured = false;
    this.smtpTransporter = null;
    this.initialize();
  }

  initialize() {
    if (this.provider === 'sendgrid') {
      this.initializeSendGrid();
    } else if (this.provider === 'smtp') {
      this.initializeSMTP();
    } else {
      console.warn('No email provider configured. Emails will be simulated.');
    }
  }

  initializeSendGrid() {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (apiKey) {
      try {
        sgMail.setApiKey(apiKey);
        this.isConfigured = true;
        console.log('SendGrid adapter initialized');
      } catch (error) {
        console.error('Failed to initialize SendGrid:', error.message);
        this.isConfigured = false;
      }
    } else {
      console.warn('SendGrid API key not configured. Emails will be simulated.');
      this.isConfigured = false;
    }
  }

  initializeSMTP() {
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    };

    if (config.host && config.auth.user && config.auth.pass) {
      try {
        this.smtpTransporter = nodemailer.createTransport(config);
        this.isConfigured = true;
        console.log('SMTP adapter initialized');
      } catch (error) {
        console.error('Failed to initialize SMTP:', error.message);
        this.isConfigured = false;
      }
    } else {
      console.warn('SMTP credentials not configured. Emails will be simulated.');
      this.isConfigured = false;
    }
  }

  async sendEmail(to, subject, htmlBody) {
    if (!this.isConfigured) {
      console.log(`[SIMULATION] Email to ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${htmlBody.substring(0, 100)}...`);
      return {
        success: true,
        messageId: `sim_email_${Date.now()}`,
        provider: this.provider,
        simulated: true
      };
    }

    if (this.provider === 'sendgrid') {
      return await this.sendWithSendGrid(to, subject, htmlBody);
    } else if (this.provider === 'smtp') {
      return await this.sendWithSMTP(to, subject, htmlBody);
    }

    return {
      success: false,
      error: 'No email provider configured'
    };
  }

  async sendWithSendGrid(to, subject, htmlBody) {
    const from = {
      email: process.env.SENDGRID_FROM_EMAIL || 'notifications@techaura.com',
      name: process.env.SENDGRID_FROM_NAME || 'Techaura'
    };

    const msg = {
      to: to,
      from: from,
      subject: subject,
      html: htmlBody
    };

    try {
      const result = await sgMail.send(msg);
      return {
        success: true,
        messageId: result[0].headers['x-message-id'],
        provider: 'sendgrid',
        statusCode: result[0].statusCode
      };
    } catch (error) {
      console.error('SendGrid error:', error.message);
      return {
        success: false,
        error: error.message,
        provider: 'sendgrid'
      };
    }
  }

  async sendWithSMTP(to, subject, htmlBody) {
    const from = {
      address: process.env.SMTP_FROM_EMAIL || 'notifications@techaura.com',
      name: process.env.SMTP_FROM_NAME || 'Techaura'
    };

    const mailOptions = {
      from: `"${from.name}" <${from.address}>`,
      to: to,
      subject: subject,
      html: htmlBody
    };

    try {
      const result = await this.smtpTransporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: result.messageId,
        provider: 'smtp',
        response: result.response
      };
    } catch (error) {
      console.error('SMTP error:', error.message);
      return {
        success: false,
        error: error.message,
        provider: 'smtp'
      };
    }
  }

  async sendWithRetry(to, subject, htmlBody, maxRetries = 3) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.sendEmail(to, subject, htmlBody);

        if (result.success) {
          return result;
        }

        lastError = result.error;
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        lastError = error.message;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: lastError || 'Max retries exceeded',
      provider: this.provider,
      retries: maxRetries
    };
  }
}

module.exports = new EmailAdapter();
