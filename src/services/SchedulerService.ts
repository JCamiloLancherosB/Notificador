import cron from 'node-cron';
import notificationOrchestrator from './NotificationOrchestrator';

export class SchedulerService {
  private isRunning = false;
  private cronJob: cron.ScheduledTask | null = null;

  start(): void {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log('Starting notification scheduler...');
    
    // Run every minute to process pending jobs
    this.cronJob = cron.schedule('* * * * *', async () => {
      try {
        await notificationOrchestrator.processPendingJobs();
      } catch (error) {
        console.error('Error processing pending jobs:', error);
      }
    });

    this.isRunning = true;
    console.log('Scheduler started successfully');
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('Scheduler stopped');
  }

  async processNow(): Promise<void> {
    console.log('Processing pending jobs manually...');
    await notificationOrchestrator.processPendingJobs();
    console.log('Manual processing complete');
  }

  getStatus(): { running: boolean } {
    return { running: this.isRunning };
  }
}

export default new SchedulerService();
