import { EmailAdapter } from '../../infrastructure/adapters/EmailAdapter';

describe('EmailAdapter', () => {
  let adapter: EmailAdapter;

  beforeEach(() => {
    adapter = new EmailAdapter();
  });

  describe('validateRecipient', () => {
    it('should validate correct email addresses', () => {
      expect(adapter.validateRecipient('test@example.com')).toBe(true);
      expect(adapter.validateRecipient('user.name@domain.co')).toBe(true);
      expect(adapter.validateRecipient('test+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(adapter.validateRecipient('invalid')).toBe(false);
      expect(adapter.validateRecipient('test@')).toBe(false);
      expect(adapter.validateRecipient('@example.com')).toBe(false);
      expect(adapter.validateRecipient('')).toBe(false);
    });
  });

  describe('send', () => {
    it('should simulate sending when not configured', async () => {
      const result = await adapter.send(
        'test@example.com',
        '<p>Test email body</p>',
        'Test Subject'
      );
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.messageId).toContain('email_sim_');
    });
  });
});
