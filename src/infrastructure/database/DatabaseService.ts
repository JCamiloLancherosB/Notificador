import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import config from '../../config';
import { NotificationJob, Recipient, AnalyticsFilter, AnalyticsSummary, NotificationChannel, NotificationStatus } from '../../domain/types';

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    // Ensure data directory exists
    const dbPath = config.database.path;
    const dbDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initializeTables();
  }

  private initializeTables() {
    // Recipients table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS recipients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        whatsapp_number TEXT,
        opt_in_email INTEGER DEFAULT 1,
        opt_in_sms INTEGER DEFAULT 1,
        opt_in_whatsapp INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Notification jobs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notification_jobs (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL,
        channel TEXT NOT NULL,
        recipient_id TEXT NOT NULL,
        recipient_contact TEXT NOT NULL,
        status TEXT NOT NULL,
        variables TEXT NOT NULL,
        scheduled_for TEXT NOT NULL,
        sent_at TEXT,
        delivered_at TEXT,
        failed_at TEXT,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        priority TEXT DEFAULT 'normal',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON notification_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_channel ON notification_jobs(channel);
      CREATE INDEX IF NOT EXISTS idx_jobs_scheduled ON notification_jobs(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_jobs_recipient ON notification_jobs(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_jobs_created ON notification_jobs(created_at);
    `);
  }

  // Recipients operations
  saveRecipient(recipient: Recipient): void {
    const id = recipient.id || this.generateId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO recipients 
      (id, name, email, phone, whatsapp_number, opt_in_email, opt_in_sms, opt_in_whatsapp, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      recipient.name,
      recipient.email || null,
      recipient.phone || null,
      recipient.whatsappNumber || null,
      recipient.optIns.email ? 1 : 0,
      recipient.optIns.sms ? 1 : 0,
      recipient.optIns.whatsapp ? 1 : 0,
      recipient.createdAt?.toISOString() || now,
      now
    );
  }

  getRecipient(id: string): Recipient | null {
    const stmt = this.db.prepare('SELECT * FROM recipients WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.mapRowToRecipient(row);
  }

  getAllRecipients(): Recipient[] {
    const stmt = this.db.prepare('SELECT * FROM recipients ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToRecipient(row));
  }

  updateRecipientOptIns(id: string, optIns: Partial<{ email: boolean; sms: boolean; whatsapp: boolean }>): void {
    const updates: string[] = [];
    const values: any[] = [];

    if (optIns.email !== undefined) {
      updates.push('opt_in_email = ?');
      values.push(optIns.email ? 1 : 0);
    }
    if (optIns.sms !== undefined) {
      updates.push('opt_in_sms = ?');
      values.push(optIns.sms ? 1 : 0);
    }
    if (optIns.whatsapp !== undefined) {
      updates.push('opt_in_whatsapp = ?');
      values.push(optIns.whatsapp ? 1 : 0);
    }

    if (updates.length === 0) return;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`UPDATE recipients SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  private mapRowToRecipient(row: any): Recipient {
    return {
      id: row.id,
      name: row.name,
      email: row.email || undefined,
      phone: row.phone || undefined,
      whatsappNumber: row.whatsapp_number || undefined,
      optIns: {
        email: row.opt_in_email === 1,
        sms: row.opt_in_sms === 1,
        whatsapp: row.opt_in_whatsapp === 1,
      },
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // Notification jobs operations
  saveJob(job: NotificationJob): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO notification_jobs 
      (id, template_id, channel, recipient_id, recipient_contact, status, variables, 
       scheduled_for, sent_at, delivered_at, failed_at, error_message, retry_count, 
       max_retries, priority, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      job.id,
      job.templateId,
      job.channel,
      job.recipientId,
      job.recipientContact,
      job.status,
      JSON.stringify(job.variables),
      job.scheduledFor.toISOString(),
      job.sentAt?.toISOString() || null,
      job.deliveredAt?.toISOString() || null,
      job.failedAt?.toISOString() || null,
      job.errorMessage || null,
      job.retryCount,
      job.maxRetries,
      job.priority,
      job.createdAt.toISOString(),
      job.updatedAt.toISOString()
    );
  }

  getJob(id: string): NotificationJob | null {
    const stmt = this.db.prepare('SELECT * FROM notification_jobs WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.mapRowToJob(row);
  }

  getPendingJobs(limit: number = 100): NotificationJob[] {
    const stmt = this.db.prepare(`
      SELECT * FROM notification_jobs 
      WHERE status IN ('pending', 'queued') 
      AND scheduled_for <= datetime('now')
      ORDER BY priority DESC, scheduled_for ASC
      LIMIT ?
    `);
    const rows = stmt.all(limit) as any[];
    return rows.map(row => this.mapRowToJob(row));
  }

  updateJobStatus(
    id: string, 
    status: NotificationStatus, 
    updates?: { 
      sentAt?: Date; 
      deliveredAt?: Date; 
      failedAt?: Date; 
      errorMessage?: string; 
      retryCount?: number 
    }
  ): void {
    const setValues: string[] = ['status = ?', 'updated_at = ?'];
    const values: any[] = [status, new Date().toISOString()];

    if (updates?.sentAt) {
      setValues.push('sent_at = ?');
      values.push(updates.sentAt.toISOString());
    }
    if (updates?.deliveredAt) {
      setValues.push('delivered_at = ?');
      values.push(updates.deliveredAt.toISOString());
    }
    if (updates?.failedAt) {
      setValues.push('failed_at = ?');
      values.push(updates.failedAt.toISOString());
    }
    if (updates?.errorMessage) {
      setValues.push('error_message = ?');
      values.push(updates.errorMessage);
    }
    if (updates?.retryCount !== undefined) {
      setValues.push('retry_count = ?');
      values.push(updates.retryCount);
    }

    values.push(id);

    const stmt = this.db.prepare(`UPDATE notification_jobs SET ${setValues.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  getJobsWithFilters(filter: AnalyticsFilter, limit: number = 1000): NotificationJob[] {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filter.channel) {
      conditions.push('channel = ?');
      values.push(filter.channel);
    }
    if (filter.status) {
      conditions.push('status = ?');
      values.push(filter.status);
    }
    if (filter.templateId) {
      conditions.push('template_id = ?');
      values.push(filter.templateId);
    }
    if (filter.recipientId) {
      conditions.push('recipient_id = ?');
      values.push(filter.recipientId);
    }
    if (filter.startDate) {
      conditions.push('created_at >= ?');
      values.push(filter.startDate.toISOString());
    }
    if (filter.endDate) {
      conditions.push('created_at <= ?');
      values.push(filter.endDate.toISOString());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit);

    const stmt = this.db.prepare(`
      SELECT * FROM notification_jobs 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ?
    `);
    
    const rows = stmt.all(...values) as any[];
    return rows.map(row => this.mapRowToJob(row));
  }

  getAnalyticsSummary(filter?: AnalyticsFilter): AnalyticsSummary {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filter?.channel) {
      conditions.push('channel = ?');
      values.push(filter.channel);
    }
    if (filter?.startDate) {
      conditions.push('created_at >= ?');
      values.push(filter.startDate.toISOString());
    }
    if (filter?.endDate) {
      conditions.push('created_at <= ?');
      values.push(filter.endDate.toISOString());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get counts by status
    const statusStmt = this.db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM notification_jobs 
      ${whereClause}
      GROUP BY status
    `);
    const statusRows = statusStmt.all(...values) as any[];
    const byStatus: Record<string, number> = {};
    statusRows.forEach(row => {
      byStatus[row.status] = row.count;
    });

    // Get counts by channel
    const channelStmt = this.db.prepare(`
      SELECT 
        channel,
        SUM(CASE WHEN status = 'sent' OR status = 'delivered' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM notification_jobs 
      ${whereClause}
      GROUP BY channel
    `);
    const channelRows = channelStmt.all(...values) as any[];
    const byChannel: Record<string, any> = {
      email: { sent: 0, delivered: 0, failed: 0 },
      sms: { sent: 0, delivered: 0, failed: 0 },
      whatsapp: { sent: 0, delivered: 0, failed: 0 },
    };
    channelRows.forEach(row => {
      byChannel[row.channel] = {
        sent: row.sent,
        delivered: row.delivered,
        failed: row.failed,
      };
    });

    // Get opt-in ratios
    const optInStmt = this.db.prepare(`
      SELECT 
        SUM(opt_in_email) as email_opted_in,
        SUM(opt_in_sms) as sms_opted_in,
        SUM(opt_in_whatsapp) as whatsapp_opted_in,
        COUNT(*) as total
      FROM recipients
    `);
    const optInRow = optInStmt.get() as any;
    const optInRatios = {
      email: optInRow.total > 0 ? optInRow.email_opted_in / optInRow.total : 0,
      sms: optInRow.total > 0 ? optInRow.sms_opted_in / optInRow.total : 0,
      whatsapp: optInRow.total > 0 ? optInRow.whatsapp_opted_in / optInRow.total : 0,
    };

    return {
      totalSent: (byStatus['sent'] || 0) + (byStatus['delivered'] || 0),
      totalDelivered: byStatus['delivered'] || 0,
      totalFailed: byStatus['failed'] || 0,
      byChannel,
      byStatus: byStatus as Record<NotificationStatus, number>,
      optInRatios,
    };
  }

  private mapRowToJob(row: any): NotificationJob {
    return {
      id: row.id,
      templateId: row.template_id,
      channel: row.channel as NotificationChannel,
      recipientId: row.recipient_id,
      recipientContact: row.recipient_contact,
      status: row.status as NotificationStatus,
      variables: JSON.parse(row.variables),
      scheduledFor: new Date(row.scheduled_for),
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      deliveredAt: row.delivered_at ? new Date(row.delivered_at) : undefined,
      failedAt: row.failed_at ? new Date(row.failed_at) : undefined,
      errorMessage: row.error_message || undefined,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      priority: row.priority as 'low' | 'normal' | 'high',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  close(): void {
    this.db.close();
  }
}

export default new DatabaseService();
