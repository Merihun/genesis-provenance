import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTestSubscription() {
  try {
    // Find all organizations
    const orgs = await prisma.organization.findMany();
    console.log('📋 Available organizations:', orgs.map(o => ({ id: o.id, name: o.name })));
    
    // Find the first organization (should be the test one)
    const org = orgs[0];
    
    if (!org) {
      console.log('❌ No organizations found in database');
      return;
    }
    
    console.log('✅ Organization found:', org.id, org.name);
    
    // Check if subscription already exists
    const existing = await prisma.subscription.findUnique({
      where: { organizationId: org.id }
    });
    
    if (existing) {
      console.log('ℹ️  Subscription already exists for this organization');
      console.log(existing);
      return;
    }
    
    // Create a test subscription
    const subscription = await prisma.subscription.create({
      data: {
        organizationId: org.id,
        plan: 'collector',
        status: 'active',
        stripeCustomerId: `cus_test_${org.id.slice(0, 8)}`,
        stripeSubscriptionId: `sub_test_${org.id.slice(0, 8)}`,
        stripePriceId: process.env.STRIPE_PRICE_COLLECTOR_MONTHLY || 'price_test_collector',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        cancelAtPeriodEnd: false,
      }
    });
    
    console.log('✅ Test subscription created:');
    console.log(subscription);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestSubscription();
