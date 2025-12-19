require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./utils/database');
const scheduler = require('./utils/scheduler');
const { apiKeyAuth } = require('./middleware/auth');

// Import routes
const notificationRoutes = require('./routes/notifications');
const templateRoutes = require('./routes/templates');
const subscriptionRoutes = require('./routes/subscriptions');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (UI)
app.use(express.static(path.join(__dirname, '../public')));

// API routes (with authentication)
app.use('/api/notifications', apiKeyAuth, notificationRoutes);
app.use('/api/templates', apiKeyAuth, templateRoutes);
app.use('/api/subscriptions', apiKeyAuth, subscriptionRoutes);

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: db.useInMemory ? 'in-memory' : 'mysql'
  });
});

// Serve UI for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Initialize and start server
async function start() {
  try {
    // Connect to database
    await db.connect();

    // Start scheduler for delayed notifications
    scheduler.start();

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Techaura Notification Service                        ║
║                                                            ║
║   Server running on: http://localhost:${PORT}              ║
║   Database: ${db.useInMemory ? 'In-Memory' : 'MySQL'}                                    ║
║   Scheduler: Active                                        ║
║                                                            ║
║   API Documentation:                                       ║
║   - POST /api/notifications/send                          ║
║   - POST /api/notifications/schedule                      ║
║   - GET  /api/notifications/history                       ║
║   - GET  /api/notifications/analytics                     ║
║   - GET  /api/templates                                   ║
║   - POST /api/templates                                   ║
║   - GET  /api/subscriptions                               ║
║   - POST /api/subscriptions                               ║
║                                                            ║
║   Web UI: http://localhost:${PORT}                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      scheduler.stop();
      await db.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('\nSIGINT received, shutting down gracefully...');
      scheduler.stop();
      await db.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
