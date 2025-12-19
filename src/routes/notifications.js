const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { validateRequest, schemas, sanitizeObject } = require('../utils/validation');

// POST /notifications/send - Send notifications
router.post('/send', async (req, res) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const validated = validateRequest(schemas.sendNotification, sanitized);

    const results = await notificationService.sendNotification(
      validated.recipients,
      validated.templateName,
      validated.variables,
      validated.channels
    );

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /notifications/schedule - Schedule notifications
router.post('/schedule', async (req, res) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const validated = validateRequest(schemas.scheduleNotification, sanitized);

    const results = await notificationService.scheduleNotification(
      validated.recipients,
      validated.templateName,
      validated.variables,
      validated.channels,
      validated.scheduledAt
    );

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Schedule notification error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /notifications/history - Get notification history
router.get('/history', async (req, res) => {
  try {
    const filters = {
      channel: req.query.channel,
      status: req.query.status,
      recipientId: req.query.recipientId,
      templateName: req.query.templateName,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit || 100
    };

    const history = await notificationService.getHistory(filters);

    res.json({
      success: true,
      count: history.length,
      notifications: history
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /notifications/analytics - Get analytics
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await notificationService.getAnalytics(
      req.query.startDate,
      req.query.endDate
    );

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
