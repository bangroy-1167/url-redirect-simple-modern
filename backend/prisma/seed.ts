/**
 * prisma/seed.ts
 *
 * Seed database with initial admin user, sample data, and default settings.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Default settings for customizable UI messages
const DEFAULT_SETTINGS = [
  { key: 'welcome_title', value: 'Welcome to modernURL8', category: 'messages' },
  { key: 'welcome_message', value: 'This is a URL redirection service. Please use a valid short URL to be redirected to your destination.', category: 'messages' },
  { key: 'welcome_button_text', value: 'Go to Homepage', category: 'messages' },
  { key: 'welcome_home_url', value: '/', category: 'messages' },
  { key: 'notfound_title', value: 'Link Not Found', category: 'messages' },
  { key: 'notfound_message', value: 'The short URL you entered does not exist or has been removed. Please check the URL and try again.', category: 'messages' },
  { key: 'notfound_button_text', value: 'Go to Homepage', category: 'messages' },
  { key: 'notfound_home_url', value: '/', category: 'messages' },
  { key: 'expired_title', value: 'Link Expired', category: 'messages' },
  { key: 'expired_message', value: 'This short URL has expired and is no longer available.', category: 'messages' },
  { key: 'expired_button_text', value: 'Go to Homepage', category: 'messages' },
  { key: 'expired_home_url', value: '/', category: 'messages' },
  { key: 'app_name', value: 'modernURL8', category: 'general' },
  { key: 'app_description', value: 'Modern URL Redirection Service', category: 'general' },
];

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ========================
  // 1. Seed Default Settings
  // ========================
  console.log('⚙️  Seeding default settings...');
  
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.urRedirectSet.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log(`   ✅ ${DEFAULT_SETTINGS.length} settings seeded\n`);

  // ========================
  // 2. Create Admin User
  // ========================
  console.log('👤 Creating admin user...');

  const adminEmail = 'admin@url8.local';
  const adminPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      username: 'admin',
      email: adminEmail,
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`   ✅ Admin user created/updated: ${admin.email}`);
  console.log(`   📝 Username: admin`);
  console.log(`   🔐 Password: admin123\n`);

  // ========================
  // 3. Create Sample URL (for testing)
  // ========================
  console.log('🔗 Creating sample URLs...');

  const sampleUrls = [
    {
      shortUrl: 'demo',
      targetUrl: 'https://www.google.com',
      title: 'Google Search',
      keterangan: 'Demo URL for testing',
      userId: admin.id,
    },
    {
      shortUrl: 'github',
      targetUrl: 'https://github.com',
      title: 'GitHub',
      keterangan: 'Developer Platform',
      userId: admin.id,
    },
  ];

  for (const urlData of sampleUrls) {
    const existing = await prisma.url8.findUnique({
      where: { shortUrl: urlData.shortUrl },
    });

    if (!existing) {
      await prisma.url8.create({
        data: urlData,
      });
      console.log(`   ✅ Created: ${urlData.shortUrl} → ${urlData.targetUrl}`);
    } else {
      console.log(`   ⏭️  Skipped (exists): ${urlData.shortUrl}`);
    }
  }

  // ========================
  // Statistics
  // ========================
  const totalUrls = await prisma.url8.count();
  const totalUsers = await prisma.user.count();
  const totalHits = await prisma.urlHit.count();
  const totalSettings = await prisma.urRedirectSet.count();

  console.log(`\n   📈 Total URLs: ${totalUrls}`);
  console.log(`   👥 Total Users: ${totalUsers}`);
  console.log(`   📊 Total Hits: ${totalHits}`);
  console.log(`   ⚙️  Total Settings: ${totalSettings}\n`);

  // ========================
  // Summary
  // ========================
  console.log('═══════════════════════════════════════');
  console.log('✅ Database seed completed successfully!');
  console.log('═══════════════════════════════════════');
  console.log('\n📋 Access URLs:');
  console.log('   🏠 Homepage:    http://localhost:38802/');
  console.log('   🔗 Redirect:   http://localhost:38802/demo');
  console.log('   🎛️  Admin:      http://localhost:38802/kelola');
  console.log('   📦 API:        http://localhost:38802/api8url');
  console.log('\n🔐 Login Credentials:');
  console.log('   Email:    admin@url8.local');
  console.log('   Password: admin123\n');
}

main()
  .then(() => {
    console.log('Seed process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
