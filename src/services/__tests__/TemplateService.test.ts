import templateService from '../services/TemplateService';
import { NotificationChannel, TemplateType } from '../domain/types';

describe('TemplateService', () => {
  describe('getTemplate', () => {
    it('should return a template by id', () => {
      const template = templateService.getTemplate('order-confirm-email');
      expect(template).toBeDefined();
      expect(template?.id).toBe('order-confirm-email');
      expect(template?.type).toBe('order_confirmation');
    });

    it('should return undefined for non-existent template', () => {
      const template = templateService.getTemplate('non-existent');
      expect(template).toBeUndefined();
    });
  });

  describe('getAllTemplates', () => {
    it('should return all templates', () => {
      const templates = templateService.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  describe('getTemplatesByChannel', () => {
    it('should return templates for email channel', () => {
      const templates = templateService.getTemplatesByChannel('email' as NotificationChannel);
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach(t => {
        expect(t.channel).toBe('email');
      });
    });

    it('should return templates for whatsapp channel', () => {
      const templates = templateService.getTemplatesByChannel('whatsapp' as NotificationChannel);
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach(t => {
        expect(t.channel).toBe('whatsapp');
      });
    });
  });

  describe('getTemplatesByType', () => {
    it('should return templates by type', () => {
      const templates = templateService.getTemplatesByType('order_confirmation' as TemplateType);
      expect(templates.length).toBeGreaterThan(0);
      templates.forEach(t => {
        expect(t.type).toBe('order_confirmation');
      });
    });
  });

  describe('renderTemplate', () => {
    it('should render template with all variables', () => {
      const variables = {
        customerName: 'John Doe',
        orderId: 'ORD-12345',
        orderDate: '2024-01-15',
        totalAmount: '$99.99',
        trackingUrl: 'https://example.com/track/12345',
      };

      const result = templateService.renderTemplate('order-confirm-email', variables);
      
      expect(result.subject).toContain('ORD-12345');
      expect(result.body).toContain('John Doe');
      expect(result.body).toContain('ORD-12345');
      expect(result.body).toContain('$99.99');
      expect(result.missingVariables.length).toBe(0);
    });

    it('should detect missing required variables', () => {
      const variables = {
        customerName: 'John Doe',
      };

      const result = templateService.renderTemplate('order-confirm-email', variables);
      
      expect(result.missingVariables.length).toBeGreaterThan(0);
      expect(result.missingVariables).toContain('orderId');
    });

    it('should use default values for optional variables', () => {
      const variables = {
        customerName: 'John Doe',
        orderId: 'ORD-12345',
        deliveryStatus: 'In Transit',
        estimatedDelivery: '2024-01-20',
        trackingUrl: 'https://example.com/track',
      };

      const result = templateService.renderTemplate('delivery-update-whatsapp', variables);
      
      expect(result.body).toBeDefined();
      expect(result.missingVariables.length).toBe(0);
    });

    it('should throw error for non-existent template', () => {
      expect(() => {
        templateService.renderTemplate('non-existent', {});
      }).toThrow('Template non-existent not found');
    });
  });

  describe('addTemplate', () => {
    it('should add a new custom template', () => {
      const newTemplate = {
        id: 'test-custom-email',
        name: 'Test Custom Email',
        type: 'custom' as TemplateType,
        channel: 'email' as NotificationChannel,
        subject: 'Test Subject - {{name}}',
        body: 'Hello {{name}}, this is a test.',
        variables: [
          { name: 'name', description: 'Recipient name', required: true },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      templateService.addTemplate(newTemplate);
      const retrieved = templateService.getTemplate('test-custom-email');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Custom Email');
    });
  });
});
