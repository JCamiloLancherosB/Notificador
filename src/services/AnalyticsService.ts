import { AnalyticsFilter, AnalyticsSummary, NotificationJob } from '../domain/types';
import databaseService from '../infrastructure/database/DatabaseService';

export class AnalyticsService {
  getSummary(filter?: AnalyticsFilter): AnalyticsSummary {
    return databaseService.getAnalyticsSummary(filter);
  }

  getHistory(filter?: AnalyticsFilter, limit: number = 1000): NotificationJob[] {
    return databaseService.getJobsWithFilters(filter || {}, limit);
  }

  getJobById(jobId: string): NotificationJob | null {
    return databaseService.getJob(jobId);
  }

  getRecentActivity(days: number = 7): {
    dailyStats: Array<{
      date: string;
      sent: number;
      delivered: number;
      failed: number;
    }>;
  } {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const jobs = databaseService.getJobsWithFilters(
      { startDate },
      10000
    );

    // Group by date
    const dailyMap = new Map<string, { sent: number; delivered: number; failed: number }>();
    
    jobs.forEach(job => {
      const date = job.createdAt.toISOString().split('T')[0];
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { sent: 0, delivered: 0, failed: 0 });
      }
      
      const stats = dailyMap.get(date)!;
      
      if (job.status === 'sent' || job.status === 'delivered') {
        stats.sent++;
      }
      if (job.status === 'delivered') {
        stats.delivered++;
      }
      if (job.status === 'failed') {
        stats.failed++;
      }
    });

    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { dailyStats };
  }

  getChannelPerformance(): {
    channels: Array<{
      channel: string;
      sent: number;
      delivered: number;
      failed: number;
      deliveryRate: number;
    }>;
  } {
    const summary = this.getSummary();
    
    const channels = Object.entries(summary.byChannel).map(([channel, stats]) => ({
      channel,
      sent: stats.sent,
      delivered: stats.delivered,
      failed: stats.failed,
      deliveryRate: stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0,
    }));

    return { channels };
  }
}

export default new AnalyticsService();
