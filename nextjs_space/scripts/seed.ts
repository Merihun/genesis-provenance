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

  const seededCategories: any = {};
  for (const category of categories) {
    const cat = await prisma.itemCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    seededCategories[category.slug] = cat;
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

  // Seed team members
  console.log('👥 Seeding team members...');
  const teamMembers = [
    { email: 'sarah.johnson@genesisprovenance.com', fullName: 'Sarah Johnson', role: 'editor' as const },
    { email: 'michael.chen@genesisprovenance.com', fullName: 'Michael Chen', role: 'viewer' as const },
    { email: 'emma.davis@genesisprovenance.com', fullName: 'Emma Davis', role: 'admin' as const },
  ];

  for (const member of teamMembers) {
    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: {},
      create: {
        email: member.email,
        passwordHash: await bcrypt.hash('demo123', 10),
        fullName: member.fullName,
        role: 'collector',
        organizationId: adminOrg.id,
        emailVerified: true,
      },
    });

    await prisma.teamMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: adminOrg.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        organizationId: adminOrg.id,
        userId: user.id,
        role: member.role,
      },
    });
    console.log(`  ✓ Created team member: ${member.fullName} (${member.role})`);
  }

  // Add admin user as owner
  await prisma.teamMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: adminOrg.id,
        userId: adminUser.id,
      },
    },
    update: {},
    create: {
      organizationId: adminOrg.id,
      userId: adminUser.id,
      role: 'owner',
    },
  });
  console.log(`  ✓ Created team member: ${adminUser.fullName} (owner)`);

  // Seed demo items
  console.log('💎 Seeding demo items...');
  
  const demoItems = [
    // Watches (5 items)
    {
      category: 'watch',
      brand: 'Rolex',
      model: 'Submariner',
      year: 2020,
      referenceNumber: '116610LN',
      serialNumber: 'V8K12345',
      purchaseDate: new Date('2020-06-15'),
      purchasePrice: 9000,
      estimatedValue: 12500,
      status: 'verified' as const,
      notes: 'Full set with box and papers. Excellent condition.',
    },
    {
      category: 'watch',
      brand: 'Patek Philippe',
      model: 'Nautilus',
      year: 2018,
      referenceNumber: '5711/1A-010',
      serialNumber: 'PP6234567',
      purchaseDate: new Date('2018-03-20'),
      purchasePrice: 28000,
      estimatedValue: 150000,
      status: 'verified' as const,
      notes: 'Rare steel model. Complete set with service history.',
    },
    {
      category: 'watch',
      brand: 'Audemars Piguet',
      model: 'Royal Oak',
      year: 2019,
      referenceNumber: '15400ST',
      serialNumber: 'AP8901234',
      purchaseDate: new Date('2019-11-10'),
      purchasePrice: 25000,
      estimatedValue: 45000,
      status: 'verified' as const,
      notes: '41mm blue dial. Full set with AP service papers.',
    },
    {
      category: 'watch',
      brand: 'Omega',
      model: 'Speedmaster Professional',
      year: 2021,
      referenceNumber: '310.30.42.50.01.001',
      serialNumber: 'OM5678901',
      purchaseDate: new Date('2021-07-04'),
      purchasePrice: 6500,
      estimatedValue: 7200,
      status: 'verified' as const,
      notes: 'Moonwatch with hesalite crystal. Unworn condition.',
    },
    {
      category: 'watch',
      brand: 'Cartier',
      model: 'Santos',
      year: 2022,
      referenceNumber: 'WSSA0029',
      serialNumber: 'CT3456789',
      purchaseDate: new Date('2022-02-14'),
      purchasePrice: 7200,
      estimatedValue: 7500,
      status: 'pending' as const,
      notes: 'Large model in steel. Recently purchased, awaiting full authentication.',
    },

    // Luxury Cars (4 items)
    {
      category: 'luxury-car',
      brand: 'Ferrari',
      model: '275 GTB/4',
      makeModel: 'Ferrari 275 GTB/4',
      year: 1967,
      vin: 'F10051',
      matchingNumbers: true,
      purchaseDate: new Date('2015-08-20'),
      purchasePrice: 2800000,
      estimatedValue: 3500000,
      status: 'verified' as const,
      notes: 'Matching numbers, concours-winning example with extensive documentation.',
    },
    {
      category: 'luxury-car',
      brand: 'Porsche',
      model: '911 Turbo S',
      makeModel: 'Porsche 911 Turbo S (992)',
      year: 2023,
      vin: 'WP0ZZZ99ZPS123456',
      matchingNumbers: true,
      purchaseDate: new Date('2023-05-10'),
      purchasePrice: 245000,
      estimatedValue: 250000,
      status: 'verified' as const,
      notes: 'Factory PTS paint, full options. 2,300 miles.',
    },
    {
      category: 'luxury-car',
      brand: 'Aston Martin',
      model: 'DB5',
      makeModel: 'Aston Martin DB5',
      year: 1964,
      vin: 'DB5/1234/R',
      matchingNumbers: true,
      purchaseDate: new Date('2019-10-15'),
      purchasePrice: 950000,
      estimatedValue: 1200000,
      status: 'verified' as const,
      notes: 'Original specification, complete restoration in 2018.',
    },
    {
      category: 'luxury-car',
      brand: 'Lamborghini',
      model: 'Countach LP400',
      makeModel: 'Lamborghini Countach LP400',
      year: 1976,
      vin: 'ZA9C00500GCL12345',
      matchingNumbers: false,
      purchaseDate: new Date('2020-12-01'),
      purchasePrice: 625000,
      estimatedValue: 750000,
      status: 'flagged' as const,
      notes: 'Engine replacement in 1985. Awaiting verification of replacement engine provenance.',
    },

    // Handbags (4 items)
    {
      category: 'handbag',
      brand: 'Hermès',
      model: 'Birkin 30',
      year: 2021,
      serialNumber: 'Y-2021',
      purchaseDate: new Date('2021-09-05'),
      purchasePrice: 12500,
      estimatedValue: 18000,
      status: 'verified' as const,
      notes: 'Togo leather in Gold with gold hardware. Pristine condition.',
    },
    {
      category: 'handbag',
      brand: 'Chanel',
      model: 'Classic Flap Medium',
      year: 2020,
      serialNumber: '29123456',
      purchaseDate: new Date('2020-11-20'),
      purchasePrice: 7500,
      estimatedValue: 10200,
      status: 'verified' as const,
      notes: 'Caviar leather in black. Complete with authenticity card and dust bag.',
    },
    {
      category: 'handbag',
      brand: 'Louis Vuitton',
      model: 'Neverfull MM',
      year: 2022,
      serialNumber: 'CA2182',
      purchaseDate: new Date('2022-03-12'),
      purchasePrice: 1800,
      estimatedValue: 1900,
      status: 'verified' as const,
      notes: 'Monogram canvas. Excellent condition with minimal wear.',
    },
    {
      category: 'handbag',
      brand: 'Hermès',
      model: 'Kelly 32',
      year: 2019,
      serialNumber: 'T-2019',
      purchaseDate: new Date('2019-06-30'),
      purchasePrice: 11000,
      estimatedValue: 16500,
      status: 'pending' as const,
      notes: 'Epsom leather in Bleu Agate. Awaiting final authentication.',
    },

    // Jewelry (4 items)
    {
      category: 'jewelry',
      brand: 'Cartier',
      model: 'Love Bracelet',
      year: 2021,
      serialNumber: 'CA234567',
      purchaseDate: new Date('2021-12-25'),
      purchasePrice: 7200,
      estimatedValue: 7500,
      status: 'verified' as const,
      notes: '18k yellow gold, size 17. Full set with original screwdriver.',
    },
    {
      category: 'jewelry',
      brand: 'Tiffany & Co.',
      model: 'Setting Engagement Ring',
      year: 2020,
      serialNumber: 'T67890123',
      purchaseDate: new Date('2020-08-14'),
      purchasePrice: 25000,
      estimatedValue: 26000,
      status: 'verified' as const,
      notes: '2.5ct diamond, E color, VS1 clarity. Platinum setting.',
    },
    {
      category: 'jewelry',
      brand: 'Van Cleef & Arpels',
      model: 'Alhambra Necklace',
      year: 2022,
      serialNumber: 'VCA345678',
      purchaseDate: new Date('2022-04-18'),
      purchasePrice: 4200,
      estimatedValue: 4500,
      status: 'verified' as const,
      notes: 'Vintage Alhambra, 10 motifs in yellow gold and malachite.',
    },
    {
      category: 'jewelry',
      brand: 'Bvlgari',
      model: 'Serpenti Bracelet',
      year: 2021,
      serialNumber: 'BV123456',
      purchaseDate: new Date('2021-10-30'),
      purchasePrice: 8500,
      estimatedValue: 9000,
      status: 'pending' as const,
      notes: 'White gold with diamond scales. Undergoing appraisal.',
    },

    // Art (3 items)
    {
      category: 'art',
      brand: 'Banksy',
      model: 'Girl with Balloon (Print)',
      year: 2006,
      serialNumber: '145/600',
      purchaseDate: new Date('2018-03-05'),
      purchasePrice: 45000,
      estimatedValue: 85000,
      status: 'verified' as const,
      notes: 'Signed and numbered screen print. Certificate of authenticity included.',
    },
    {
      category: 'art',
      brand: 'Andy Warhol',
      model: 'Campbell\'s Soup (Portfolio)',
      year: 1969,
      serialNumber: '78/250',
      purchaseDate: new Date('2016-11-22'),
      purchasePrice: 120000,
      estimatedValue: 180000,
      status: 'verified' as const,
      notes: 'Complete set of 10 screen prints. Excellent condition.',
    },
    {
      category: 'art',
      brand: 'KAWS',
      model: 'Companion (Original Painting)',
      year: 2019,
      purchaseDate: new Date('2019-07-10'),
      purchasePrice: 250000,
      estimatedValue: 400000,
      status: 'verified' as const,
      notes: 'Acrylic on canvas, 48x36 inches. Direct from gallery.',
    },

    // Collectibles (3 items)
    {
      category: 'collectible',
      brand: 'Pokémon',
      model: 'Charizard Holo 1st Edition',
      year: 1999,
      serialNumber: 'PSA 10 Gem Mint',
      purchaseDate: new Date('2021-02-15'),
      purchasePrice: 350000,
      estimatedValue: 420000,
      status: 'verified' as const,
      notes: 'Base Set 1st Edition. PSA 10 graded. Perfect centering.',
    },
    {
      category: 'collectible',
      brand: 'Nike',
      model: 'Air Jordan 1 "Chicago" (1985)',
      year: 1985,
      serialNumber: 'Size 10',
      purchaseDate: new Date('2020-09-20'),
      purchasePrice: 28000,
      estimatedValue: 35000,
      status: 'verified' as const,
      notes: 'Original 1985 production. Deadstock condition with OG box.',
    },
    {
      category: 'collectible',
      brand: 'LEGO',
      model: 'Star Wars Millennium Falcon (10179)',
      year: 2007,
      serialNumber: 'UCS',
      purchaseDate: new Date('2022-01-30'),
      purchasePrice: 4500,
      estimatedValue: 6500,
      status: 'pending' as const,
      notes: 'Original Ultimate Collector Series. Complete, sealed in box.',
    },
  ];

  for (const itemData of demoItems) {
    const category = seededCategories[itemData.category];
    const item = await prisma.item.create({
      data: {
        organizationId: adminOrg.id,
        createdByUserId: adminUser.id,
        categoryId: category.id,
        brand: itemData.brand,
        model: itemData.model,
        year: itemData.year,
        referenceNumber: itemData.referenceNumber,
        serialNumber: itemData.serialNumber,
        vin: itemData.vin,
        makeModel: itemData.makeModel,
        matchingNumbers: itemData.matchingNumbers,
        purchaseDate: itemData.purchaseDate,
        purchasePrice: itemData.purchasePrice,
        estimatedValue: itemData.estimatedValue,
        status: itemData.status,
        notes: itemData.notes,
        riskScore: itemData.status === 'verified' ? 10 : itemData.status === 'pending' ? 50 : 75,
      },
    });

    // Create initial provenance event
    await prisma.provenanceEvent.create({
      data: {
        itemId: item.id,
        userId: adminUser.id,
        eventType: 'registered',
        title: 'Asset Registered',
        description: `${itemData.brand} ${itemData.model} registered in provenance vault.`,
        occurredAt: itemData.purchaseDate || new Date(),
      },
    });

    // Add additional provenance events for verified items
    if (item.status === 'verified') {
      await prisma.provenanceEvent.create({
        data: {
          itemId: item.id,
          userId: adminUser.id,
          eventType: 'reviewed',
          title: 'Authentication Review Completed',
          description: 'Comprehensive authentication review passed all verification checks.',
          occurredAt: new Date(item.createdAt.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days later
        },
      });

      await prisma.provenanceEvent.create({
        data: {
          itemId: item.id,
          userId: adminUser.id,
          eventType: 'status_changed',
          title: 'Status: Verified',
          description: 'Asset authenticity confirmed. Provenance documentation complete.',
          occurredAt: new Date(item.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days later
        },
      });

      // Add appraisal for high-value items
      if (item.estimatedValue && Number(item.estimatedValue) > 100000) {
        await prisma.provenanceEvent.create({
          data: {
            itemId: item.id,
            userId: adminUser.id,
            eventType: 'appraisal',
            title: 'Professional Appraisal',
            description: `Independent appraisal conducted. Current market value: $${Number(item.estimatedValue).toLocaleString()}.`,
            occurredAt: new Date(item.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days later
          },
        });
      }
    }

    // Add service records for luxury cars
    if (itemData.category === 'luxury-car' && item.status === 'verified') {
      await prisma.provenanceEvent.create({
        data: {
          itemId: item.id,
          userId: adminUser.id,
          eventType: 'service_record',
          title: 'Annual Service Completed',
          description: 'Comprehensive service by authorized dealer. All systems checked and certified.',
          occurredAt: new Date(item.createdAt.getTime() + 180 * 24 * 60 * 60 * 1000), // 6 months later
        },
      });

      if (itemData.matchingNumbers) {
        await prisma.provenanceEvent.create({
          data: {
            itemId: item.id,
            userId: adminUser.id,
            eventType: 'inspection',
            title: 'Matching Numbers Verification',
            description: 'Engine and chassis numbers verified as original and matching.',
            occurredAt: new Date(item.createdAt.getTime() + 10 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    // Add sample media assets (using public placeholder images)
    const mediaTypes: ('photo' | 'document')[] = ['photo', 'photo', 'document'];
    for (let i = 0; i < mediaTypes.length; i++) {
      await prisma.mediaAsset.create({
        data: {
          itemId: item.id,
          type: mediaTypes[i],
          fileName: `${item.brand}_${item.model}_${mediaTypes[i]}_${i + 1}.jpg`,
          cloudStoragePath: `demo/assets/${item.id}/${mediaTypes[i]}_${i + 1}.jpg`,
          fileSize: 1024 * 1024 * 2, // 2MB
          mimeType: mediaTypes[i] === 'photo' ? 'image/jpeg' : 'application/pdf',
          isPublic: false,
        },
      });
    }

    console.log(`  ✓ Created item: ${itemData.brand} ${itemData.model} with events and media`);
  }

  // Create activity logs
  console.log('📊 Seeding activity logs...');
  const activityLogs = [
    {
      userId: adminUser.id,
      action: 'user.login',
      resource: 'auth',
      resourceId: adminUser.id,
      details: { method: 'credentials', success: true },
    },
    {
      userId: adminUser.id,
      action: 'item.create',
      resource: 'item',
      resourceId: null,
      details: { category: 'watch', brand: 'Rolex' },
    },
    {
      userId: adminUser.id,
      action: 'team.invite',
      resource: 'team',
      resourceId: null,
      details: { email: 'sarah.johnson@genesisprovenance.com', role: 'editor' },
    },
  ];

  for (const log of activityLogs) {
    await prisma.auditLog.create({
      data: log,
    });
  }
  console.log(`  ✓ Created ${activityLogs.length} activity log entries`);

  console.log('✅ Database seed completed successfully!');
  console.log('');
  console.log('📝 Summary:');
  console.log(`   - 7 categories`);
  console.log(`   - 1 organization`);
  console.log(`   - 4 users (1 admin + 3 team members)`);
  console.log(`   - ${demoItems.length} demo items`);
  console.log(`   - ${demoItems.length * 3 + demoItems.filter(i => i.status === 'verified').length * 2} provenance events`);
  console.log(`   - ${demoItems.length * 3} media assets`);
  console.log(`   - ${activityLogs.length} activity logs`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
