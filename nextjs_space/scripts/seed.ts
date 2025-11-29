import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed Item Categories
  console.log('📦 Seeding item categories...');
  const categories = [
    { name: 'Watch', slug: 'watch' },
    { name: 'Handbag', slug: 'handbag' },
    { name: 'Jewelry', slug: 'jewelry' },
    { name: 'Art', slug: 'art' },
    { name: 'Collectible', slug: 'collectible' },
    { name: 'Luxury Car', slug: 'luxury-car' },
    { name: 'Other', slug: 'other' },
  ];

  for (const category of categories) {
    await prisma.itemCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    console.log(`  ✓ Created category: ${category.name}`);
  }

  // Seed default admin organization and user
  console.log('🏢 Seeding default admin organization and user...');
  
  const adminOrg = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Genesis Provenance Admin',
      type: 'enterprise',
    },
  });
  console.log(`  ✓ Created admin organization: ${adminOrg.name}`);

  const passwordHash = await bcrypt.hash('johndoe123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      passwordHash: passwordHash,
      fullName: 'John Doe',
      role: 'admin',
      organizationId: adminOrg.id,
      emailVerified: true,
    },
  });
  console.log(`  ✓ Created admin user: ${adminUser.email}`);

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
