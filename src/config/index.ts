import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface Config {
  server: {
    port: number;
    nodeEnv: string;
  };
  database: {
    path: string;
  };
  whatsapp: {
    provider: 'twilio' | 'meta';
    twilio?: {
      accountSid: string;
      authToken: string;
      fromNumber: string;
    };
    meta?: {
      token: string;
      phoneId: string;
    };
  };
  email: {
    provider: 'smtp' | 'sendgrid';
    from: string;
    smtp?: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password: string;
    };
    sendgrid?: {
      apiKey: string;
    };
  };
  sms: {
    provider: 'twilio';
    twilio: {
      accountSid: string;
      authToken: string;
      fromNumber: string;
    };
  };
  sample: {
    whatsappNumber: string;
  };
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    path: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'notifications.db'),
  },
  whatsapp: {
    provider: (process.env.WHATSAPP_PROVIDER as 'twilio' | 'meta') || 'twilio',
    twilio: {
      accountSid: process.env.WHATSAPP_ACCOUNT_SID || '',
      authToken: process.env.WHATSAPP_AUTH_TOKEN || '',
      fromNumber: process.env.WHATSAPP_FROM_NUMBER || '',
    },
    meta: {
      token: process.env.META_WHATSAPP_TOKEN || '',
      phoneId: process.env.META_WHATSAPP_PHONE_ID || '',
    },
  },
  email: {
    provider: (process.env.EMAIL_PROVIDER as 'smtp' | 'sendgrid') || 'smtp',
    from: process.env.EMAIL_FROM || 'notifications@techaura.com',
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
    },
  },
  sms: {
    provider: 'twilio',
    twilio: {
      accountSid: process.env.SMS_ACCOUNT_SID || process.env.WHATSAPP_ACCOUNT_SID || '',
      authToken: process.env.SMS_AUTH_TOKEN || process.env.WHATSAPP_AUTH_TOKEN || '',
      fromNumber: process.env.SMS_FROM_NUMBER || '',
    },
  },
  sample: {
    whatsappNumber: process.env.SAMPLE_WHATSAPP_NUMBER || '3008602789',
  },
};

export default config;
