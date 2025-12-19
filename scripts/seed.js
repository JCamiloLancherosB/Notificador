require('dotenv').config();
const db = require('../src/utils/database');
const subscriptionService = require('../src/services/subscriptionService');

async function seed() {
  console.log('🌱 Starting seed script...\n');

  try {
    // Connect to database
    await db.connect();
    console.log('✅ Connected to database\n');

    // Create sample subscriptions
    console.log('Creating sample subscriptions...');
    
    const sampleUsers = [
      {
        userId: 'user001',
        subscriptions: [
          { channel: 'whatsapp', contact: '573008602789', optedIn: true },
          { channel: 'sms', contact: '573008602789', optedIn: true },
          { channel: 'email', contact: 'juan@techaura.com', optedIn: true }
        ]
      },
      {
        userId: 'user002',
        subscriptions: [
          { channel: 'whatsapp', contact: '573001234567', optedIn: true },
          { channel: 'email', contact: 'maria@example.com', optedIn: true }
        ]
      },
      {
        userId: 'user003',
        subscriptions: [
          { channel: 'email', contact: 'carlos@example.com', optedIn: false }
        ]
      },
      {
        userId: 'user004',
        subscriptions: [
          { channel: 'whatsapp', contact: '573009876543', optedIn: true },
          { channel: 'sms', contact: '573009876543', optedIn: false }
        ]
      }
    ];

    for (const user of sampleUsers) {
      for (const sub of user.subscriptions) {
        await subscriptionService.updateSubscription(
          user.userId,
          sub.channel,
          sub.contact,
          sub.optedIn
        );
        console.log(`  ✓ ${user.userId} - ${sub.channel}: ${sub.optedIn ? 'opted in' : 'opted out'}`);
      }
    }

    console.log('\n✅ Seed data created successfully!\n');

    // Show summary
    console.log('📊 Summary:');
    console.log(`  - ${sampleUsers.length} sample users created`);
    console.log(`  - Built-in templates available (9 templates)`);
    console.log('  - Ready to send notifications!\n');

    console.log('💡 Sample curl command to send a notification:');
    console.log(`
curl -X POST http://localhost:${process.env.PORT || 3000}/api/notifications/send \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${process.env.API_KEY || 'your-api-key-here'}" \\
  -d '{
    "recipients": [{
      "userId": "user001",
      "channels": {
        "whatsapp": "573008602789",
        "email": "juan@techaura.com"
      }
    }],
    "templateName": "order_confirmation",
    "variables": {
      "customerName": "Juan",
      "orderId": "ORD-12345",
      "supportUrl": "https://techaura.com/support"
    },
    "channels": ["whatsapp", "email"]
  }'
    `);

    await db.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    await db.close();
    process.exit(1);
  }
}

seed();
