import express, { Request, Response } from 'express';
import databaseService from '../infrastructure/database/DatabaseService';
import optInService from '../services/OptInService';
import { validateRequest, recipientSchema, optInUpdateSchema } from '../utils/validation';

const router = express.Router();

// Get all recipients
router.get('/', (req: Request, res: Response) => {
  try {
    const recipients = databaseService.getAllRecipients();
    res.json({ success: true, recipients });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Get recipient by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const recipient = databaseService.getRecipient(req.params.id);
    
    if (!recipient) {
      return res.status(404).json({ success: false, error: 'Recipient not found' });
    }
    
    res.json({ success: true, recipient });
  } catch (error) {
    console.error('Error fetching recipient:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Create or update recipient
router.post('/', (req: Request, res: Response) => {
  try {
    const { value, error } = validateRequest(recipientSchema, req.body);
    
    if (error) {
      return res.status(400).json({ success: false, error });
    }

    databaseService.saveRecipient(value);
    res.json({ success: true, recipient: value });
  } catch (error) {
    console.error('Error saving recipient:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Update opt-in preferences
router.patch('/:id/opt-ins', (req: Request, res: Response) => {
  try {
    const { value, error } = validateRequest(optInUpdateSchema, req.body);
    
    if (error) {
      return res.status(400).json({ success: false, error });
    }

    optInService.updateAllOptIns(req.params.id, value);
    const updatedOptIns = optInService.getOptInStatus(req.params.id);
    
    res.json({ success: true, optIns: updatedOptIns });
  } catch (error) {
    console.error('Error updating opt-ins:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Get opt-in status
router.get('/:id/opt-ins', (req: Request, res: Response) => {
  try {
    const optIns = optInService.getOptInStatus(req.params.id);
    
    if (!optIns) {
      return res.status(404).json({ success: false, error: 'Recipient not found' });
    }
    
    res.json({ success: true, optIns });
  } catch (error) {
    console.error('Error fetching opt-ins:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

export default router;
