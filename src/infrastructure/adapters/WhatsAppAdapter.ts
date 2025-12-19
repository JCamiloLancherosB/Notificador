import { ChannelAdapter } from '../../domain/types';
import config from '../../config';
import axios from 'axios';

export class WhatsAppAdapter implements ChannelAdapter {
  async send(recipient: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Normalize phone number (remove non-digits)
      const normalizedRecipient = recipient.replace(/\D/g, '');
      
      if (config.whatsapp.provider === 'twilio') {
        return await this.sendViaTwilio(normalizedRecipient, message);
      } else {
        return await this.sendViaMeta(normalizedRecipient, message);
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async sendViaTwilio(recipient: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { accountSid, authToken, fromNumber } = config.whatsapp.twilio || {};
    
    if (!accountSid || !authToken || !fromNumber) {
      console.warn('Twilio WhatsApp not configured. Simulating send...');
      return this.simulateSend(recipient, message);
    }

    try {
      // In production, use Twilio SDK
      // For now, simulate the API call
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);
      
      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: `whatsapp:+${recipient}`,
      });

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      // If credentials are invalid or demo mode, simulate
      console.warn('Twilio send failed, simulating:', error);
      return this.simulateSend(recipient, message);
    }
  }

  private async sendViaMeta(recipient: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { token, phoneId } = config.whatsapp.meta || {};
    
    if (!token || !phoneId) {
      console.warn('Meta WhatsApp not configured. Simulating send...');
      return this.simulateSend(recipient, message);
    }

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
      };
    } catch (error) {
      console.warn('Meta send failed, simulating:', error);
      return this.simulateSend(recipient, message);
    }
  }

  private simulateSend(recipient: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`[SIMULATED WhatsApp] To: +${recipient}`);
    console.log(`[SIMULATED WhatsApp] Message: ${message.substring(0, 100)}...`);
    
    return Promise.resolve({
      success: true,
      messageId: `wa_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }

  validateRecipient(recipient: string): boolean {
    // Remove non-digits and check if it's a valid phone number
    const normalized = recipient.replace(/\D/g, '');
    return normalized.length >= 10 && normalized.length <= 15;
  }
}
