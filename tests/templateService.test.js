const templateService = require('../src/services/templateService');

describe('Template Service', () => {
  describe('renderTemplate', () => {
    test('should render WhatsApp template with variables', () => {
      const template = {
        name: 'test',
        content_whatsapp: 'Hello {{name}}, your order {{orderId}} is ready!'
      };
      
      const result = templateService.renderTemplate(template, 'whatsapp', {
        name: 'John',
        orderId: '12345'
      });

      expect(result).toBe('Hello John, your order 12345 is ready!');
    });

    test('should render email template with variables', () => {
      const template = {
        name: 'test',
        content_email_subject: 'Order {{orderId}}',
        content_email_body: 'Hello {{name}}'
      };
      
      const result = templateService.renderTemplate(template, 'email', {
        name: 'John',
        orderId: '12345'
      });

      expect(result).toEqual({
        subject: 'Order 12345',
        body: 'Hello John'
      });
    });

    test('should throw error for unsupported channel', () => {
      const template = {
        name: 'test',
        content_whatsapp: null
      };
      
      expect(() => {
        templateService.renderTemplate(template, 'whatsapp', {});
      }).toThrow();
    });
  });

  describe('validateTemplateVariables', () => {
    test('should not throw for valid variables', () => {
      const template = {
        variables: ['name', 'orderId']
      };

      expect(() => {
        templateService.validateTemplateVariables(template, {
          name: 'John',
          orderId: '12345'
        });
      }).not.toThrow();
    });

    test('should throw for missing variables', () => {
      const template = {
        variables: ['name', 'orderId']
      };

      expect(() => {
        templateService.validateTemplateVariables(template, {
          name: 'John'
        });
      }).toThrow('Missing required variables: orderId');
    });
  });
});
