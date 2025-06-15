import { PrismaClient } from '../src/generated/prisma';
import { createApiKey } from '../src/lib/auth';

const prisma = new PrismaClient();

async function seedApiKeys() {
  console.log('🔑 Seeding API keys...');

  try {
    // Create a read-only API key
    const readOnlyKey = await createApiKey(
      'External Booking System - Read Only',
      { read: true, book: false, admin: false },
      1000 // 1000 requests per minute
    );

    console.log('✅ Created read-only API key:');
    console.log(`   Name: ${readOnlyKey.name}`);
    console.log(`   Key: ${readOnlyKey.apiKey}`);
    console.log(`   Permissions: ${JSON.stringify(readOnlyKey.permissions)}`);
    console.log('');

    // Create a booking API key
    const bookingKey = await createApiKey(
      'External Booking System - Full Access',
      { read: true, book: true, admin: false },
      500 // 500 requests per minute
    );

    console.log('✅ Created booking API key:');
    console.log(`   Name: ${bookingKey.name}`);
    console.log(`   Key: ${bookingKey.apiKey}`);
    console.log(`   Permissions: ${JSON.stringify(bookingKey.permissions)}`);
    console.log('');

    // Create an admin API key
    const adminKey = await createApiKey(
      'Admin Dashboard',
      { read: true, book: true, admin: true },
      2000 // 2000 requests per minute
    );

    console.log('✅ Created admin API key:');
    console.log(`   Name: ${adminKey.name}`);
    console.log(`   Key: ${adminKey.apiKey}`);
    console.log(`   Permissions: ${JSON.stringify(adminKey.permissions)}`);
    console.log('');

    console.log('🎉 API keys seeded successfully!');
    console.log('');
    console.log('💡 Save these API keys securely - they will not be shown again!');
    console.log('');
    console.log('📝 Example usage:');
    console.log('   curl -H "Authorization: ApiKey ' + readOnlyKey.apiKey + '" \\');
    console.log('        http://localhost:3004/api/venues/[venueId]/seat-map');

  } catch (error) {
    console.error('❌ Error seeding API keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedApiKeys(); 