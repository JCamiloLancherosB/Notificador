import databaseService from '../infrastructure/database/DatabaseService';
import config from '../config';
import { Recipient } from '../domain/types';

console.log('===========================================');
console.log('  Seeding Database with Sample Data');
console.log('===========================================\n');

// Sample recipients
const sampleRecipients: Recipient[] = [
  {
    id: 'recipient_001',
    name: 'Juan Carlos Pérez',
    email: 'juan.perez@example.com',
    phone: '3001234567',
    whatsappNumber: config.sample.whatsappNumber, // Use the configured sample number
    optIns: {
      email: true,
      sms: true,
      whatsapp: true,
    },
  },
  {
    id: 'recipient_002',
    name: 'María González',
    email: 'maria.gonzalez@example.com',
    phone: '3109876543',
    whatsappNumber: '3109876543',
    optIns: {
      email: true,
      sms: false,
      whatsapp: true,
    },
  },
  {
    id: 'recipient_003',
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@example.com',
    phone: '3201234567',
    whatsappNumber: '3201234567',
    optIns: {
      email: true,
      sms: true,
      whatsapp: false,
    },
  },
  {
    id: 'recipient_004',
    name: 'Ana Martínez',
    email: 'ana.martinez@example.com',
    phone: '3158765432',
    whatsappNumber: '3158765432',
    optIns: {
      email: false,
      sms: true,
      whatsapp: true,
    },
  },
  {
    id: 'recipient_005',
    name: 'Luis Hernández',
    email: 'luis.hernandez@example.com',
    phone: '3007654321',
    whatsappNumber: '3007654321',
    optIns: {
      email: true,
      sms: true,
      whatsapp: true,
    },
  },
];

console.log('Seeding recipients...');
sampleRecipients.forEach(recipient => {
  databaseService.saveRecipient(recipient);
  console.log(`  ✓ Added recipient: ${recipient.name} (${recipient.id})`);
});

console.log('\n===========================================');
console.log('  Seeding Complete!');
console.log('===========================================');
console.log(`\nSample Recipients: ${sampleRecipients.length}`);
console.log(`\nYou can now:`);
console.log(`  1. Start the server: npm run dev`);
console.log(`  2. Send test notifications via API`);
console.log(`  3. View the dashboard (once frontend is running)`);
console.log(`\nSample WhatsApp Number: ${config.sample.whatsappNumber}`);
console.log('===========================================\n');
