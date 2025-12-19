const subscriptionService = require('../src/services/subscriptionService');
const db = require('../src/utils/database');

describe('Subscription Service', () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('checkOptIn', () => {
    test('should return true for non-existent subscription (default opt-in)', async () => {
      const result = await subscriptionService.checkOptIn('user123', 'email', 'test@example.com');
      expect(result).toBe(true);
    });
  });

  describe('updateSubscription', () => {
    test('should create new subscription when opted in', async () => {
      const result = await subscriptionService.updateSubscription(
        'user456',
        'whatsapp',
        '573001234567',
        true
      );

      expect(result).toEqual({
        userId: 'user456',
        channel: 'whatsapp',
        contact: '573001234567',
        optedIn: true
      });
    });

    test('should create new subscription when opted out', async () => {
      const result = await subscriptionService.updateSubscription(
        'user789',
        'sms',
        '573009876543',
        false
      );

      expect(result).toEqual({
        userId: 'user789',
        channel: 'sms',
        contact: '573009876543',
        optedIn: false
      });
    });
  });
});
