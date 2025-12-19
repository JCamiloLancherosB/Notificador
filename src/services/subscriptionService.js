const db = require('../utils/database');

class SubscriptionService {
  async checkOptIn(userId, channel, contact) {
    const subscriptions = await db.query(
      'SELECT * FROM subscriptions WHERE user_id = ? AND channel = ?',
      [userId, channel]
    );

    if (subscriptions.length === 0) {
      // No subscription record - assume opted in by default
      return true;
    }

    return subscriptions[0].opted_in;
  }

  async updateSubscription(userId, channel, contact, optedIn) {
    // Check if subscription exists
    const existing = await db.query(
      'SELECT * FROM subscriptions WHERE user_id = ? AND channel = ?',
      [userId, channel]
    );

    if (existing.length > 0) {
      // Update existing subscription
      await db.query(
        `UPDATE subscriptions SET opted_in = ?, contact = ?, 
         opted_in_at = ?, opted_out_at = ? WHERE user_id = ? AND channel = ?`,
        [
          optedIn,
          contact,
          optedIn ? new Date() : null,
          optedIn ? null : new Date(),
          userId,
          channel
        ]
      );
    } else {
      // Create new subscription
      await db.query(
        `INSERT INTO subscriptions (user_id, channel, contact, opted_in, opted_in_at, opted_out_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          channel,
          contact,
          optedIn,
          optedIn ? new Date() : null,
          optedIn ? null : new Date()
        ]
      );
    }

    return { userId, channel, contact, optedIn };
  }

  async getSubscriptions(userId) {
    const subscriptions = await db.query(
      'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY channel',
      [userId]
    );

    return subscriptions.map(s => ({
      id: s.id,
      userId: s.user_id,
      channel: s.channel,
      contact: s.contact,
      optedIn: s.opted_in,
      optedInAt: s.opted_in_at,
      optedOutAt: s.opted_out_at,
      createdAt: s.created_at,
      updatedAt: s.updated_at
    }));
  }

  async getAllSubscriptions() {
    const subscriptions = await db.query(
      'SELECT * FROM subscriptions ORDER BY user_id, channel'
    );

    return subscriptions.map(s => ({
      id: s.id,
      userId: s.user_id,
      channel: s.channel,
      contact: s.contact,
      optedIn: s.opted_in,
      optedInAt: s.opted_in_at,
      optedOutAt: s.opted_out_at,
      createdAt: s.created_at,
      updatedAt: s.updated_at
    }));
  }

  async getOptInStats() {
    const subscriptions = await db.query('SELECT * FROM subscriptions');

    const stats = {
      total: subscriptions.length,
      optedIn: 0,
      optedOut: 0,
      byChannel: {
        whatsapp: { total: 0, optedIn: 0, optedOut: 0 },
        sms: { total: 0, optedIn: 0, optedOut: 0 },
        email: { total: 0, optedIn: 0, optedOut: 0 }
      }
    };

    subscriptions.forEach(sub => {
      if (sub.opted_in) {
        stats.optedIn++;
        stats.byChannel[sub.channel].optedIn++;
      } else {
        stats.optedOut++;
        stats.byChannel[sub.channel].optedOut++;
      }
      stats.byChannel[sub.channel].total++;
    });

    return stats;
  }
}

module.exports = new SubscriptionService();
