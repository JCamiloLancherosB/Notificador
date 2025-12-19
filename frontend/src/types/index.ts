export type NotificationChannel = 'whatsapp' | 'email' | 'sms';

export type NotificationStatus = 
  | 'pending' 
  | 'queued' 
  | 'sent' 
  | 'delivered' 
  | 'failed' 
  | 'cancelled';

export interface Template {
  id: string;
  name: string;
  type: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables: TemplateVariable[];
  isActive: boolean;
}

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
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
}

export interface NotificationRequest {
  templateId: string;
  channels: NotificationChannel[];
  recipient: Recipient;
  variables: Record<string, string>;
  scheduledFor?: Date;
  priority?: 'low' | 'normal' | 'high';
}

export interface NotificationJob {
  id: string;
  templateId: string;
  channel: NotificationChannel;
  recipientId: string;
  recipientContact: string;
  status: NotificationStatus;
  variables: Record<string, string>;
  scheduledFor: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSummary {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  byChannel: Record<string, {
    sent: number;
    delivered: number;
    failed: number;
  }>;
  byStatus: Record<string, number>;
  optInRatios: {
    email: number;
    sms: number;
    whatsapp: number;
  };
}
