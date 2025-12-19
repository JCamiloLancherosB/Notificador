import express, { Request, Response } from 'express';
import templateService from '../services/TemplateService';

const router = express.Router();

// Get all templates
router.get('/', (_req: Request, res: Response) => {
  try {
    const templates = templateService.getAllTemplates();
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Get template by ID
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const template = templateService.getTemplate(req.params.id);
    
    if (!template) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }
    
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Get templates by channel
router.get('/channel/:channel', (req: Request, res: Response): void => {
  try {
    const channel = req.params.channel as 'email' | 'sms' | 'whatsapp';
    
    if (!['email', 'sms', 'whatsapp'].includes(channel)) {
      res.status(400).json({ success: false, error: 'Invalid channel' });
      return;
    }
    
    const templates = templateService.getTemplatesByChannel(channel);
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates by channel:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Render template preview
router.post('/:id/preview', (req: Request, res: Response): void => {
  try {
    const { variables } = req.body;
    
    if (!variables || typeof variables !== 'object') {
      res.status(400).json({ success: false, error: 'Variables object required' });
      return;
    }
    
    const rendered = templateService.renderTemplate(req.params.id, variables);
    res.json({ success: true, rendered });
  } catch (error) {
    console.error('Error rendering template:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

export default router;
