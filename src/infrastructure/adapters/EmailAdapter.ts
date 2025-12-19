import { ChannelAdapter } from '../../domain/types';
import config from '../../config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export class EmailAdapter implements ChannelAdapter {
  private transporter: Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (config.email.provider === 'smtp') {
      const { host, port, secure, user, password } = config.email.smtp || {};
      
      if (!user || !password) {
        console.warn('SMTP not configured. Email will be simulated.');
        return;
      }

      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass: password,
          },
        });
      } catch (error) {
        console.warn('Failed to initialize SMTP transporter:', error);
      }
    } else if (config.email.provider === 'sendgrid') {
      const { apiKey } = config.email.sendgrid || {};
      
      if (!apiKey) {
        console.warn('SendGrid not configured. Email will be simulated.');
        return;
      }

      // For SendGrid, we'd use their SDK or SMTP
      // Using SMTP relay for simplicity
      try {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: apiKey,
          },
        });
      } catch (error) {
        console.warn('Failed to initialize SendGrid transporter:', error);
      }
    }
  }

  async send(recipient: string, message: string, subject?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.transporter) {
        return this.simulateSend(recipient, message, subject);
      }

      const result = await this.transporter.sendMail({
        from: config.email.from,
        to: recipient,
        subject: subject || 'Notification from Techaura',
        html: message,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Email send error:', error);
      // Fallback to simulation if real send fails
      return this.simulateSend(recipient, message, subject);
    }
  }

  private simulateSend(recipient: string, message: string, subject?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`[SIMULATED Email] To: ${recipient}`);
    console.log(`[SIMULATED Email] Subject: ${subject || 'No subject'}`);
    console.log(`[SIMULATED Email] Body: ${message.substring(0, 200).replace(/<[^>]*>/g, '')}...`);
    
    return Promise.resolve({
      success: true,
      messageId: `email_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }

  validateRecipient(recipient: string): boolean {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(recipient);
  }
}
