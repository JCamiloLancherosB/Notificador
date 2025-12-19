import optInService from '../OptInService';
import { Recipient, NotificationChannel } from '../../domain/types';

describe('OptInService', () => {
  const mockRecipient: Recipient = {
    id: 'test-recipient-1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    whatsappNumber: '1234567890',
    optIns: {
      email: true,
      sms: false,
      whatsapp: true,
    },
  };

  describe('canSendToChannel', () => {
    it('should allow sending to opted-in email channel', () => {
      const result = optInService.canSendToChannel(mockRecipient, 'email' as NotificationChannel);
      expect(result).toBe(true);
    });

    it('should not allow sending to opted-out sms channel', () => {
      const result = optInService.canSendToChannel(mockRecipient, 'sms' as NotificationChannel);
      expect(result).toBe(false);
    });

    it('should allow sending to opted-in whatsapp channel', () => {
      const result = optInService.canSendToChannel(mockRecipient, 'whatsapp' as NotificationChannel);
      expect(result).toBe(true);
    });

    it('should not allow sending if contact info is missing', () => {
      const recipientWithoutEmail: Recipient = {
        ...mockRecipient,
        email: undefined,
      };
      
      const result = optInService.canSendToChannel(recipientWithoutEmail, 'email' as NotificationChannel);
      expect(result).toBe(false);
    });
  });

  describe('getRecipientContact', () => {
    it('should return email for email channel', () => {
      const contact = optInService.getRecipientContact(mockRecipient, 'email' as NotificationChannel);
      expect(contact).toBe('test@example.com');
    });

    it('should return null for opted-out channel', () => {
      const contact = optInService.getRecipientContact(mockRecipient, 'sms' as NotificationChannel);
      expect(contact).toBe(null);
    });

    it('should return whatsapp number for whatsapp channel', () => {
      const contact = optInService.getRecipientContact(mockRecipient, 'whatsapp' as NotificationChannel);
      expect(contact).toBe('1234567890');
    });

    it('should return null if contact info is missing', () => {
      const recipientWithoutPhone: Recipient = {
        ...mockRecipient,
        phone: undefined,
      };
      
      const contact = optInService.getRecipientContact(recipientWithoutPhone, 'sms' as NotificationChannel);
      expect(contact).toBe(null);
    });
  });
});
