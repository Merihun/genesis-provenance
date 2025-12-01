import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getStripe, createCheckoutSession, getStripePriceId } from '@/lib/stripe';
import { SubscriptionPlan } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { plan, billingCycle } = await request.json();

    // Validate plan
    if (!['collector', 'dealer', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { success: false, message: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (!['monthly', 'annual'].includes(billingCycle)) {
      return NextResponse.json(
        { success: false, message: 'Invalid billing cycle' },
        { status: 400 }
      );
    }

    const organizationId = user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'No organization found' },
        { status: 400 }
      );
    }

    // Get or create organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check for existing subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    // Check if they already have an active subscription
    if (
      existingSubscription &&
      existingSubscription.status === 'active' &&
      existingSubscription.plan === plan
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'You are already subscribed to this plan',
        },
        { status: 400 }
      );
    }

    // Get Stripe client
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { success: false, message: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId = existingSubscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: organization.name,
        metadata: {
          organizationId: organization.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Get the price ID for the selected plan and billing cycle
    const priceId = getStripePriceId(plan as SubscriptionPlan, billingCycle);

    if (!priceId) {
      return NextResponse.json(
        { success: false, message: 'Price not found for this plan' },
        { status: 500 }
      );
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/settings/billing?canceled=true`,
      metadata: {
        organizationId: organization.id,
        plan,
        billingCycle,
      },
      // If they have an existing subscription, allow them to switch
      ...(existingSubscription?.stripeSubscriptionId && {
        subscription_data: {
          metadata: {
            organizationId: organization.id,
          },
        },
      }),
    });

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
