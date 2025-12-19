import { 
  NotificationRequest, 
  BulkNotificationRequest, 
  NotificationJob, 
  NotificationChannel,
} from '../domain/types';
import templateService from './TemplateService';
import optInService from './OptInService';
import databaseService from '../infrastructure/database/DatabaseService';
import { WhatsAppAdapter } from '../infrastructure/adapters/WhatsAppAdapter';
import { EmailAdapter } from '../infrastructure/adapters/EmailAdapter';
import { SMSAdapter } from '../infrastructure/adapters/SMSAdapter';

export class NotificationOrchestrator {
  private whatsappAdapter = new WhatsAppAdapter();
  private emailAdapter = new EmailAdapter();
  private smsAdapter = new SMSAdapter();

  async sendNotification(request: NotificationRequest): Promise<{
    success: boolean;
    jobIds: string[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const jobIds: string[] = [];

    // Save recipient if they don't have an ID
    if (!request.recipient.id) {
      const recipientId = this.generateId();
      request.recipient.id = recipientId;
      databaseService.saveRecipient(request.recipient);
    } else {
      // Update recipient info
      databaseService.saveRecipient(request.recipient);
    }

    // Create jobs for each channel
    for (const channel of request.channels) {
      if (!optInService.canSendToChannel(request.recipient, channel)) {
        errors.push(`Recipient has not opted in for ${channel} or missing contact info`);
        continue;
      }

      const contact = optInService.getRecipientContact(request.recipient, channel);
      if (!contact) {
        errors.push(`No valid contact for ${channel}`);
        continue;
      }

      const job: NotificationJob = {
        id: this.generateId(),
        templateId: request.templateId,
        channel,
        recipientId: request.recipient.id!,
        recipientContact: contact,
        status: 'pending',
        variables: request.variables,
        scheduledFor: request.scheduledFor || new Date(),
        retryCount: 0,
        maxRetries: 3,
        priority: request.priority || 'normal',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      databaseService.saveJob(job);
      jobIds.push(job.id);
    }

    return {
      success: jobIds.length > 0,
      jobIds,
      errors,
    };
  }

  async sendBulkNotification(request: BulkNotificationRequest): Promise<{
    success: boolean;
    jobIds: string[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const jobIds: string[] = [];

    for (const recipient of request.recipients) {
      // Merge common variables with recipient-specific ones
      const variables = {
        ...request.variables,
        ...(request.recipientVariables?.get(recipient.id || '') || {}),
      };

      const result = await this.sendNotification({
        templateId: request.templateId,
        channels: request.channels,
        recipient,
        variables,
        scheduledFor: request.scheduledFor,
        priority: request.priority,
      });

      jobIds.push(...result.jobIds);
      errors.push(...result.errors);
    }

    return {
      success: jobIds.length > 0,
      jobIds,
      errors,
    };
  }

  async processJob(job: NotificationJob): Promise<void> {
    try {
      // Update status to queued
      databaseService.updateJobStatus(job.id, 'queued');

      // Render template
      const template = templateService.getTemplate(job.templateId);
      if (!template) {
        throw new Error(`Template ${job.templateId} not found`);
      }

      const rendered = templateService.renderTemplate(job.templateId, job.variables);
      if (rendered.missingVariables.length > 0) {
        throw new Error(`Missing required variables: ${rendered.missingVariables.join(', ')}`);
      }

      // Validate recipient
      const adapter = this.getAdapter(job.channel);
      if (!adapter.validateRecipient(job.recipientContact)) {
        throw new Error(`Invalid recipient contact: ${job.recipientContact}`);
      }

      // Send notification
      const result = await adapter.send(
        job.recipientContact,
        rendered.body,
        rendered.subject
      );

      if (result.success) {
        databaseService.updateJobStatus(job.id, 'sent', {
          sentAt: new Date(),
        });

        // Simulate delivery confirmation (in real scenario, this would come from webhooks)
        setTimeout(() => {
          databaseService.updateJobStatus(job.id, 'delivered', {
            deliveredAt: new Date(),
          });
        }, 1000);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if we should retry
      if (job.retryCount < job.maxRetries) {
        databaseService.updateJobStatus(job.id, 'pending', {
          retryCount: job.retryCount + 1,
          errorMessage,
        });
      } else {
        databaseService.updateJobStatus(job.id, 'failed', {
          failedAt: new Date(),
          errorMessage,
        });
      }
    }
  }

  async processPendingJobs(): Promise<void> {
    const jobs = databaseService.getPendingJobs(50);
    
    for (const job of jobs) {
      await this.processJob(job);
      // Add a small delay to avoid overwhelming providers
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private getAdapter(channel: NotificationChannel) {
    switch (channel) {
      case 'whatsapp':
        return this.whatsappAdapter;
      case 'email':
        return this.emailAdapter;
      case 'sms':
        return this.smsAdapter;
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new NotificationOrchestrator();
