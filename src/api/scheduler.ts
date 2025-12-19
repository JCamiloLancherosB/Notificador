import express, { Request, Response } from 'express';
import schedulerService from '../services/SchedulerService';

const router = express.Router();

// Get scheduler status
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = schedulerService.getStatus();
    res.json({ success: true, status });
  } catch (error) {
    console.error('Error fetching scheduler status:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Process pending jobs immediately
router.post('/process', async (req: Request, res: Response) => {
  try {
    await schedulerService.processNow();
    res.json({ success: true, message: 'Jobs processed successfully' });
  } catch (error) {
    console.error('Error processing jobs:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

export default router;
