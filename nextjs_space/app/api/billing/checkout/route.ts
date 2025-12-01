import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getStripe, createCheckoutSession, getStripePriceId } from '@/lib/stripe';
import { SubscriptionPlan } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('[Checkout] Starting checkout session creation...');
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !user?.id) {
      console.error('[Checkout] Unauthorized: No session');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { plan, billingCycle } = await request.json();
    console.log('[Checkout] Request:', { 
      plan, 
      billingCycle, 
      userEmail: user.email,
      organizationId: user.organizationId 
    });

    // Validate plan
    if (!['collector', 'dealer', 'enterprise'].includes(plan)) {
      console.error('[Checkout] Invalid plan:', plan);
      return NextResponse.json(
        { success: false, message: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (!['monthly', 'annual'].includes(billingCycle)) {
      console.error('[Checkout] Invalid billing cycle:', billingCycle);
      return NextResponse.json(
        { success: false, message: 'Invalid billing cycle' },
        { status: 400 }
      );
    }

    const organizationId = user.organizationId;
    if (!organizationId) {
      console.error('[Checkout] No organization found');
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
      console.error('[Checkout] Stripe is not configured');
      return NextResponse.json(
        { success: false, message: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    console.log('[Checkout] Stripe client initialized');

    // Get or create Stripe customer
    let stripeCustomerId = existingSubscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      console.log('[Checkout] Creating new Stripe customer...');
      const customer = await stripe.customers.create({
        email: user.email,
        name: organization.name,
        metadata: {
          organizationId: organization.id,
        },
      });
      stripeCustomerId = customer.id;
      console.log('[Checkout] Created Stripe customer:', stripeCustomerId);
    } else {
      console.log('[Checkout] Using existing Stripe customer:', stripeCustomerId);
    }

    // Get the price ID for the selected plan and billing cycle
    const priceId = getStripePriceId(plan as SubscriptionPlan, billingCycle);
    console.log('[Checkout] Price ID:', priceId);

    if (!priceId) {
      console.error('[Checkout] Price not found for plan:', plan, billingCycle);
      return NextResponse.json(
        { success: false, message: `Price not found for ${plan} ${billingCycle}. Please contact support.` },
        { status: 500 }
      );
    }

    // Create Stripe Checkout Session
    console.log('[Checkout] Creating Stripe Checkout session...');
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

    console.log('[Checkout] Checkout session created successfully:', {
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error: any) {
    console.error('[Checkout] Error creating checkout session:', error);
    console.error('[Checkout] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create checkout session',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
