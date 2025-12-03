import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { getStripe, getPlanFromPriceId } from '@/lib/stripe';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Disable body parsing for webhooks
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Handling checkout.session.completed:', session.id);
  console.log('Session metadata:', session.metadata);
  console.log('Session subscription ID:', session.subscription);

  const organizationId = session.metadata?.organizationId;
  if (!organizationId) {
    console.error('No organizationId in checkout session metadata');
    console.error('Available session metadata:', session.metadata);
    return;
  }

  console.log('Checkout completed for organization:', organizationId);

  // Get the subscription from Stripe
  if (session.subscription && typeof session.subscription === 'string') {
    const stripe = getStripe()!;
    console.log('Retrieving subscription from Stripe:', session.subscription);
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    console.log('Retrieved subscription, processing update...');
    await handleSubscriptionUpdate(subscription);
    console.log('Subscription update completed successfully');
  } else {
    console.error('No subscription found in checkout session');
    console.error('Session object:', JSON.stringify(session, null, 2));
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('Handling subscription update:', subscription.id);
  console.log('Subscription metadata:', subscription.metadata);
  console.log('Subscription status:', subscription.status);

  const customerId = subscription.customer as string;
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) {
    console.error('No organizationId in subscription metadata');
    console.error('Available metadata:', subscription.metadata);
    return;
  }

  console.log('Processing subscription for organization:', organizationId);

  // Get the price ID and determine the plan
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    console.error('No price ID found in subscription');
    console.error('Subscription items:', subscription.items.data);
    return;
  }

  console.log('Price ID:', priceId);

  const plan = getPlanFromPriceId(priceId);
  if (!plan) {
    console.error(`Unknown price ID: ${priceId}`);
    console.error('Available price IDs:', {
      collector_monthly: process.env.STRIPE_PRICE_COLLECTOR_MONTHLY,
      collector_annual: process.env.STRIPE_PRICE_COLLECTOR_ANNUAL,
      dealer_monthly: process.env.STRIPE_PRICE_DEALER_MONTHLY,
      dealer_annual: process.env.STRIPE_PRICE_DEALER_ANNUAL,
      enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
      enterprise_annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL,
    });
    return;
  }

  console.log('Determined plan:', plan);

  // Determine subscription status
  let status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete';
  switch (subscription.status) {
    case 'active':
      status = 'active';
      break;
    case 'trialing':
      status = 'trialing';
      break;
    case 'past_due':
      status = 'past_due';
      break;
    case 'canceled':
      status = 'cancelled';
      break;
    default:
      status = 'incomplete';
  }

  // Upsert subscription in database
  const subscriptionData = subscription as any; // Cast to any to access Stripe properties
  
  await prisma.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      plan,
      status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
      currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
      cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
      trialEnd: subscriptionData.trial_end
        ? new Date(subscriptionData.trial_end * 1000)
        : null,
    },
    update: {
      plan,
      status,
      stripeCustomerId: customerId, // Ensure Stripe customer ID is updated
      stripeSubscriptionId: subscription.id, // Ensure Stripe subscription ID is updated
      stripePriceId: priceId,
      currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
      currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
      cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
      canceledAt: subscriptionData.canceled_at
        ? new Date(subscriptionData.canceled_at * 1000)
        : null,
      trialEnd: subscriptionData.trial_end
        ? new Date(subscriptionData.trial_end * 1000)
        : null,
    },
  });

  console.log(`Subscription updated for organization ${organizationId}: ${plan} (${status})`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Handling subscription deleted:', subscription.id);

  const organizationId = subscription.metadata?.organizationId;
  if (!organizationId) {
    console.error('No organizationId in subscription metadata');
    return;
  }

  // Update subscription status to cancelled
  await prisma.subscription.update({
    where: { organizationId },
    data: {
      status: 'cancelled',
      canceledAt: new Date(),
    },
  });

  console.log(`Subscription canceled for organization ${organizationId}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Handling invoice.payment_succeeded:', invoice.id);

  // If this is for a subscription, the subscription.updated event will handle it
  // This is mainly for logging/auditing purposes
  const invoiceData = invoice as any;
  const subscriptionId = invoiceData.subscription as string | null;
  if (subscriptionId) {
    console.log(`Payment succeeded for subscription ${subscriptionId}`);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Handling invoice.payment_failed:', invoice.id);

  // Update subscription status to past_due if payment fails
  const invoiceData = invoice as any;
  const subscriptionId = invoiceData.subscription as string | null;
  if (subscriptionId) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'past_due' },
      });

      console.log(`Subscription ${subscriptionId} marked as past_due`);
    }
  }
}
