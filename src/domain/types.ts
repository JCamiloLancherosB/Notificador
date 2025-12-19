export type NotificationChannel = 'whatsapp' | 'email' | 'sms';

export type NotificationStatus = 
  | 'pending' 
  | 'queued' 
  | 'sent' 
  | 'delivered' 
  | 'failed' 
  | 'cancelled';

export type TemplateType = 
  | 'order_confirmation'
  | 'delivery_update'
  | 'abandoned_cart'
  | 'newsletter'
  | 'promo'
  | 'password_reset'
  | 'payment_receipt'
  | 'custom';

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: TemplateType;
  channel: NotificationChannel;
  subject?: string; // For email
  body: string;
  variables: TemplateVariable[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recipient {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  optIns: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationRequest {
  templateId: string;
  channels: NotificationChannel[];
  recipient: Recipient;
  variables: Record<string, string>;
  scheduledFor?: Date;
  priority?: 'low' | 'normal' | 'high';
}

export interface BulkNotificationRequest {
  templateId: string;
  channels: NotificationChannel[];
  recipients: Recipient[];
  variables: Record<string, string>; // Common variables for all
  recipientVariables?: Map<string, Record<string, string>>; // Per-recipient variables
  scheduledFor?: Date;
  priority?: 'low' | 'normal' | 'high';
}

export interface NotificationJob {
  id: string;
  templateId: string;
  channel: NotificationChannel;
  recipientId: string;
  recipientContact: string; // email, phone, or whatsapp number
  status: NotificationStatus;
  variables: Record<string, string>;
  scheduledFor: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsFilter {
  channel?: NotificationChannel;
  status?: NotificationStatus;
  startDate?: Date;
  endDate?: Date;
  templateId?: string;
  recipientId?: string;
}

export interface AnalyticsSummary {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  byChannel: Record<NotificationChannel, {
    sent: number;
    delivered: number;
    failed: number;
  }>;
  byStatus: Record<NotificationStatus, number>;
  optInRatios: {
    email: number;
    sms: number;
    whatsapp: number;
  };
}

export interface ChannelAdapter {
  send(
    recipient: string,
    message: string,
    subject?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
  
  validateRecipient(recipient: string): boolean;
}
