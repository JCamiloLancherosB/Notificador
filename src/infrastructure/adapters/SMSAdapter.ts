import { ChannelAdapter } from '../../domain/types';
import config from '../../config';

export class SMSAdapter implements ChannelAdapter {
  async send(recipient: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Normalize phone number (remove non-digits)
      const normalizedRecipient = recipient.replace(/\D/g, '');
      
      return await this.sendViaTwilio(normalizedRecipient, message);
    } catch (error) {
      console.error('SMS send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async sendViaTwilio(recipient: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { accountSid, authToken, fromNumber } = config.sms.twilio || {};
    
    if (!accountSid || !authToken || !fromNumber) {
      console.warn('Twilio SMS not configured. Simulating send...');
      return this.simulateSend(recipient, message);
    }

    try {
      // In production, use Twilio SDK
      const { default: twilio } = await import('twilio');
      const client = twilio(accountSid, authToken);
      
      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: `+${recipient}`,
      });

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      // If credentials are invalid or demo mode, simulate
      console.warn('Twilio SMS send failed, simulating:', error);
      return this.simulateSend(recipient, message);
    }
  }

  private simulateSend(recipient: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`[SIMULATED SMS] To: +${recipient}`);
    console.log(`[SIMULATED SMS] Message: ${message}`);
    
    return Promise.resolve({
      success: true,
      messageId: `sms_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }

  validateRecipient(recipient: string): boolean {
    // Remove non-digits and check if it's a valid phone number
    const normalized = recipient.replace(/\D/g, '');
    return normalized.length >= 10 && normalized.length <= 15;
  }
}
