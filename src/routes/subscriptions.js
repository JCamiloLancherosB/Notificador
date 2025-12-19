const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { validateRequest, schemas, sanitizeObject } = require('../utils/validation');

// GET /subscriptions - Get all subscriptions
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;

    if (userId) {
      const subscriptions = await subscriptionService.getSubscriptions(userId);
      res.json({
        success: true,
        count: subscriptions.length,
        subscriptions
      });
    } else {
      const subscriptions = await subscriptionService.getAllSubscriptions();
      res.json({
        success: true,
        count: subscriptions.length,
        subscriptions
      });
    }
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /subscriptions/stats - Get opt-in statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await subscriptionService.getOptInStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /subscriptions - Update subscription (opt-in/out)
router.post('/', async (req, res) => {
  try {
    const sanitized = sanitizeObject(req.body);
    const validated = validateRequest(schemas.updateSubscription, sanitized);

    const subscription = await subscriptionService.updateSubscription(
      validated.userId,
      validated.channel,
      validated.contact,
      validated.optedIn
    );

    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
