const { validatePhone, validateEmail, sanitizeInput } = require('../src/utils/validation');

describe('Validation Utils', () => {
  describe('validatePhone', () => {
    test('should validate correct phone numbers', () => {
      expect(validatePhone('3008602789')).toBe(true);
      expect(validatePhone('573008602789')).toBe(true);
      expect(validatePhone('+57 300 860 2789')).toBe(true);
    });

    test('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    test('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    test('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    test('should remove dangerous characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
      expect(sanitizeInput('data:text/html,<script>alert(1)</script>')).toBe('text/html,scriptalert(1)/script');
      expect(sanitizeInput('vbscript:alert(1)')).toBe('alert(1)');
      expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
      expect(sanitizeInput('onclick =alert(1)')).toBe('alert(1)');
    });

    test('should preserve safe content', () => {
      expect(sanitizeInput('Hello World')).toBe('Hello World');
      expect(sanitizeInput('Order #12345')).toBe('Order #12345');
    });
  });
});
