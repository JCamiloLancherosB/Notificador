import { SMSAdapter } from '../../infrastructure/adapters/SMSAdapter';

describe('SMSAdapter', () => {
  let adapter: SMSAdapter;

  beforeEach(() => {
    adapter = new SMSAdapter();
  });

  describe('validateRecipient', () => {
    it('should validate correct phone numbers', () => {
      expect(adapter.validateRecipient('1234567890')).toBe(true);
      expect(adapter.validateRecipient('+573001234567')).toBe(true);
      expect(adapter.validateRecipient('3008602789')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(adapter.validateRecipient('123')).toBe(false);
      expect(adapter.validateRecipient('abc')).toBe(false);
      expect(adapter.validateRecipient('')).toBe(false);
    });
  });

  describe('send', () => {
    it('should simulate sending when not configured', async () => {
      const result = await adapter.send('3008602789', 'Test SMS message');
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.messageId).toContain('sms_sim_');
    });
  });
});
