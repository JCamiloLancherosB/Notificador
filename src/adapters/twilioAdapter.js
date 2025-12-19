const twilio = require('twilio');

class TwilioAdapter {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.initialize();
  }

  initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken) {
      try {
        this.client = twilio(accountSid, authToken);
        this.isConfigured = true;
        console.log('Twilio adapter initialized');
      } catch (error) {
        console.error('Failed to initialize Twilio:', error.message);
        this.isConfigured = false;
      }
    } else {
      console.warn('Twilio credentials not configured. WhatsApp and SMS will be simulated.');
      this.isConfigured = false;
    }
  }

  async sendWhatsApp(to, message) {
    const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:+${to}`;

    if (!this.isConfigured) {
      console.log(`[SIMULATION] WhatsApp to ${toNumber}: ${message}`);
      return {
        success: true,
        messageId: `sim_wa_${Date.now()}`,
        provider: 'twilio',
        simulated: true
      };
    }

    try {
      const result = await this.client.messages.create({
        from: from,
        to: toNumber,
        body: message
      });

      return {
        success: true,
        messageId: result.sid,
        provider: 'twilio',
        status: result.status
      };
    } catch (error) {
      console.error('Twilio WhatsApp error:', error.message);
      return {
        success: false,
        error: error.message,
        provider: 'twilio'
      };
    }
  }

  async sendSMS(to, message) {
    const from = process.env.TWILIO_SMS_FROM || '+1234567890';
    const toNumber = to.startsWith('+') ? to : `+${to}`;

    if (!this.isConfigured) {
      console.log(`[SIMULATION] SMS to ${toNumber}: ${message}`);
      return {
        success: true,
        messageId: `sim_sms_${Date.now()}`,
        provider: 'twilio',
        simulated: true
      };
    }

    try {
      const result = await this.client.messages.create({
        from: from,
        to: toNumber,
        body: message
      });

      return {
        success: true,
        messageId: result.sid,
        provider: 'twilio',
        status: result.status
      };
    } catch (error) {
      console.error('Twilio SMS error:', error.message);
      return {
        success: false,
        error: error.message,
        provider: 'twilio'
      };
    }
  }

  async sendWithRetry(channel, to, message, maxRetries = 3) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = channel === 'whatsapp' 
          ? await this.sendWhatsApp(to, message)
          : await this.sendSMS(to, message);

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
      provider: 'twilio',
      retries: maxRetries
    };
  }
}

module.exports = new TwilioAdapter();
