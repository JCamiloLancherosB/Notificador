import express, { Request, Response } from 'express';
import analyticsService from '../services/AnalyticsService';

const router = express.Router();

// Get analytics summary
router.get('/summary', (req: Request, res: Response) => {
  try {
    const filter: any = {};
    
    if (req.query.channel) filter.channel = req.query.channel;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.startDate) filter.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filter.endDate = new Date(req.query.endDate as string);
    if (req.query.templateId) filter.templateId = req.query.templateId;
    if (req.query.recipientId) filter.recipientId = req.query.recipientId;

    const summary = analyticsService.getSummary(filter);
    res.json({ success: true, summary });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Get notification history
router.get('/history', (req: Request, res: Response) => {
  try {
    const filter: any = {};
    
    if (req.query.channel) filter.channel = req.query.channel;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.startDate) filter.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filter.endDate = new Date(req.query.endDate as string);
    if (req.query.templateId) filter.templateId = req.query.templateId;
    if (req.query.recipientId) filter.recipientId = req.query.recipientId;

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 1000;
    
    const history = analyticsService.getHistory(filter, limit);
    res.json({ success: true, history, count: history.length });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Get job by ID
router.get('/job/:id', (req: Request, res: Response): void => {
  try {
    const job = analyticsService.getJobById(req.params.id);
    
    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }
    
    res.json({ success: true, job });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Get recent activity
router.get('/activity/recent', (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
    const activity = analyticsService.getRecentActivity(days);
    res.json({ success: true, activity });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Get channel performance
router.get('/performance/channels', (_req: Request, res: Response) => {
  try {
    const performance = analyticsService.getChannelPerformance();
    res.json({ success: true, performance });
  } catch (error) {
    console.error('Error fetching channel performance:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

export default router;
