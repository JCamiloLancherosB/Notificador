import { Recipient, NotificationChannel } from '../domain/types';
import databaseService from '../infrastructure/database/DatabaseService';

export class OptInService {
  canSendToChannel(recipient: Recipient, channel: NotificationChannel): boolean {
    switch (channel) {
      case 'email':
        return recipient.optIns.email && !!recipient.email;
      case 'sms':
        return recipient.optIns.sms && !!recipient.phone;
      case 'whatsapp':
        return recipient.optIns.whatsapp && !!recipient.whatsappNumber;
      default:
        return false;
    }
  }

  getRecipientContact(recipient: Recipient, channel: NotificationChannel): string | null {
    if (!this.canSendToChannel(recipient, channel)) {
      return null;
    }

    switch (channel) {
      case 'email':
        return recipient.email || null;
      case 'sms':
        return recipient.phone || null;
      case 'whatsapp':
        return recipient.whatsappNumber || null;
      default:
        return null;
    }
  }

  updateOptIn(recipientId: string, channel: NotificationChannel, optedIn: boolean): void {
    const optIns: any = {};
    optIns[channel] = optedIn;
    databaseService.updateRecipientOptIns(recipientId, optIns);
  }

  updateAllOptIns(recipientId: string, optIns: { email?: boolean; sms?: boolean; whatsapp?: boolean }): void {
    databaseService.updateRecipientOptIns(recipientId, optIns);
  }

  getOptInStatus(recipientId: string): { email: boolean; sms: boolean; whatsapp: boolean } | null {
    const recipient = databaseService.getRecipient(recipientId);
    return recipient ? recipient.optIns : null;
  }
}

export default new OptInService();
