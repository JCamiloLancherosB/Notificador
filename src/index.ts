import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import config from './config';
import schedulerService from './services/SchedulerService';

// Import routes
import notificationsRouter from './api/notifications';
import templatesRouter from './api/templates';
import analyticsRouter from './api/analytics';
import recipientsRouter from './api/recipients';
import schedulerRouter from './api/scheduler';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api/notifications', notificationsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/recipients', recipientsRouter);
app.use('/api/scheduler', schedulerRouter);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    scheduler: schedulerService.getStatus(),
  });
});

// Serve frontend static files in production
if (config.server.nodeEnv === 'production') {
  const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Error handling
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: config.server.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Start server
const PORT = config.server.port;

const server = app.listen(PORT, () => {
  console.log('===========================================');
  console.log('  Notificador - Multi-Channel Notification System');
  console.log('===========================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.server.nodeEnv}`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  - Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  - Notifications: http://localhost:${PORT}/api/notifications`);
  console.log(`  - Templates: http://localhost:${PORT}/api/templates`);
  console.log(`  - Analytics: http://localhost:${PORT}/api/analytics`);
  console.log(`  - Recipients: http://localhost:${PORT}/api/recipients`);
  console.log(`  - Scheduler: http://localhost:${PORT}/api/scheduler`);
  console.log('===========================================\n');
  
  // Start the scheduler
  schedulerService.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  schedulerService.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  schedulerService.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
