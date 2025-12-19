const notificationService = require('../services/notificationService');

class Scheduler {
  constructor(intervalMs = 60000) { // Default: check every 60 seconds
    this.intervalMs = intervalMs;
    this.isRunning = false;
    this.intervalId = null;
  }

  start() {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log(`Starting scheduler with interval: ${this.intervalMs}ms`);
    this.isRunning = true;

    // Run immediately on start
    this.processScheduledNotifications();

    // Then run at intervals
    this.intervalId = setInterval(() => {
      this.processScheduledNotifications();
    }, this.intervalMs);
  }

  stop() {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return;
    }

    console.log('Stopping scheduler');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async processScheduledNotifications() {
    try {
      console.log(`[${new Date().toISOString()}] Processing scheduled notifications...`);
      const results = await notificationService.processScheduledNotifications();

      if (results.length > 0) {
        console.log(`Processed ${results.length} scheduled notifications`);
        results.forEach(result => {
          console.log(`  - Notification ${result.notificationId}: ${result.status}`);
        });
      }
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }
}

module.exports = new Scheduler();
