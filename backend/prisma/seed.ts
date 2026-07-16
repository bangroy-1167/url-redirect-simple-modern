/**
 * prisma/seed.ts
 *
 * Seed database with initial admin user and sample data.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ========================
  // 1. Create Admin User
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
  // 2. Create Sample URL (for testing)
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
  // 3. Migrate Legacy Data (if exists)
  // ========================
  console.log('\n📊 Checking for legacy data migration...\n');

  // Check if we need to migrate from legacy url8 table
  // This is a placeholder for actual legacy migration logic
  // The actual migration would:
  // 1. Read from raw SQL query to existing url8 table
  // 2. Transform data to new schema
  // 3. Insert with userId = null (or create default user)

  const totalUrls = await prisma.url8.count();
  const totalUsers = await prisma.user.count();
  const totalHits = await prisma.urlHit.count();

  console.log(`   📈 Total URLs: ${totalUrls}`);
  console.log(`   👥 Total Users: ${totalUsers}`);
  console.log(`   📊 Total Hits: ${totalHits}\n`);

  // ========================
  // Summary
  // ========================
  console.log('═══════════════════════════════════════');
  console.log('✅ Database seed completed successfully!');
  console.log('═══════════════════════════════════════');
  console.log('\n📋 Next steps:');
  console.log('   1. Run: npm run dev:backend');
  console.log('   2. Login at http://localhost:8002/api8url/auth/login');
  console.log('   3. Credentials: admin@url8.local / admin123');
  console.log('   4. Test URL: http://localhost:8002/api8url/demo\n');
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
