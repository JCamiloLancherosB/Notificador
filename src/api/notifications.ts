import express, { Request, Response } from 'express';
import notificationOrchestrator from '../services/NotificationOrchestrator';
import { 
  validateRequest, 
  notificationRequestSchema, 
  bulkNotificationRequestSchema,
  sanitizeObject 
} from '../utils/validation';

const router = express.Router();

// Send single notification
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { value, error } = validateRequest(notificationRequestSchema, req.body);
    
    if (error) {
      return res.status(400).json({ success: false, error });
    }

    // Sanitize variables
    value.variables = sanitizeObject(value.variables);

    const result = await notificationOrchestrator.sendNotification(value);
    
    res.json(result);
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Send bulk notifications
router.post('/send-bulk', async (req: Request, res: Response) => {
  try {
    const { value, error } = validateRequest(bulkNotificationRequestSchema, req.body);
    
    if (error) {
      return res.status(400).json({ success: false, error });
    }

    // Sanitize variables
    value.variables = sanitizeObject(value.variables);

    const result = await notificationOrchestrator.sendBulkNotification(value);
    
    res.json(result);
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

export default router;
