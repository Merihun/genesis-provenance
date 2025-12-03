/**
 * Stripe Integration Utility
 * Provides Stripe client configuration and helper functions for subscription management
 */

import Stripe from 'stripe';
import { SubscriptionPlan } from '@prisma/client';

// Lazy initialization of Stripe client
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.warn('STRIPE_SECRET_KEY is not set. Stripe features will not work.');
      // Return a dummy stripe instance to prevent build errors
      throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// Export stripe instance (lazy loaded)
export const stripe = (() => {
  try {
    return getStripe();
  } catch (error) {
    // During build, return null if Stripe is not configured
    return null as any;
  }
})();

// Plan configuration with pricing details
export const PLAN_CONFIG = {
  collector: {
    name: 'Collector',
    description: 'Perfect for individual collectors managing personal luxury assets',
    limits: {
      assets: 50,
      teamMembers: 1,
      aiAnalysesPerMonth: 25,
      storageGB: 5,
      vinLookupsPerMonth: 10,
    },
    features: {
      pdfCertificates: true,
      advancedAnalytics: false,
      prioritySupport: false,
      apiAccess: false,
    },
    pricing: {
      monthly: { amount: 2900, display: '$29' },
      annual: { amount: 29000, display: '$290', savings: '$58' },
    },
  },
  dealer: {
    name: 'Dealer',
    description: 'For dealers and boutiques managing inventory',
    limits: {
      assets: 500,
      teamMembers: 5,
      aiAnalysesPerMonth: 250,
      storageGB: 50,
      vinLookupsPerMonth: 100,
    },
    features: {
      pdfCertificates: true,
      advancedAnalytics: true,
      prioritySupport: false,
      apiAccess: false,
    },
    pricing: {
      monthly: { amount: 9900, display: '$99' },
      annual: { amount: 99000, display: '$990', savings: '$198' },
    },
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Custom solution for large organizations',
    limits: {
      assets: -1, // Unlimited
      teamMembers: -1, // Unlimited
      aiAnalysesPerMonth: -1, // Unlimited
      storageGB: -1, // Unlimited
      vinLookupsPerMonth: -1, // Unlimited
    },
    features: {
      pdfCertificates: true,
      advancedAnalytics: true,
      prioritySupport: true,
      apiAccess: true,
    },
    pricing: {
      monthly: { amount: 39900, display: '$399' },
      annual: { amount: 399000, display: '$3,990', savings: '$798' },
    },
  },
} as const;

// Stripe Price IDs (to be filled after creating products in Stripe Dashboard)
export const STRIPE_PRICE_IDS = {
  collector_monthly: process.env.STRIPE_PRICE_COLLECTOR_MONTHLY || '',
  collector_annual: process.env.STRIPE_PRICE_COLLECTOR_ANNUAL || '',
  dealer_monthly: process.env.STRIPE_PRICE_DEALER_MONTHLY || '',
  dealer_annual: process.env.STRIPE_PRICE_DEALER_ANNUAL || '',
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
  enterprise_annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || '',
} as const;

/**
 * Get plan configuration for a subscription plan
 */
export function getPlanConfig(plan: SubscriptionPlan) {
  return PLAN_CONFIG[plan];
}

/**
 * Get Stripe Price ID for a plan and billing cycle
 */
export function getStripePriceId(
  plan: SubscriptionPlan,
  interval: 'monthly' | 'annual'
): string {
  const key = `${plan}_${interval}` as keyof typeof STRIPE_PRICE_IDS;
  const priceId = STRIPE_PRICE_IDS[key];
  
  if (!priceId) {
    console.warn(`Stripe Price ID not configured for ${plan} ${interval}`);
  }
  
  return priceId;
}

/**
 * Determine subscription plan from Stripe Price ID
 */
export function getPlanFromPriceId(priceId: string): SubscriptionPlan | null {
  const entries = Object.entries(STRIPE_PRICE_IDS) as [keyof typeof STRIPE_PRICE_IDS, string][];
  const entry = entries.find(([_, id]) => id === priceId);
  
  if (!entry) return null;
  
  const [key] = entry;
  const plan = key.split('_')[0] as SubscriptionPlan;
  return plan;
}

/**
 * Create a Stripe customer for an organization
 */
export async function createStripeCustomer(params: {
  email: string;
  name: string;
  organizationId: string;
}): Promise<Stripe.Customer> {
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      organizationId: params.organizationId,
    },
  });
  
  return customer;
}

/**
 * Retrieve a Stripe customer
 */
export async function getStripeCustomer(
  customerId: string
): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return customer as Stripe.Customer;
  } catch (error) {
    console.error('Error retrieving Stripe customer:', error);
    return null;
  }
}

/**
 * Create a checkout session for a new subscription
 */
export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}): Promise<Stripe.Checkout.Session> {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: params.customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    subscription_data: {},
  };
  
  // Add trial period if specified
  if (params.trialDays && params.trialDays > 0) {
    sessionParams.subscription_data!.trial_period_days = params.trialDays;
  }
  
  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

/**
 * Create a customer portal session for managing subscription
 */
export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
  
  return session;
}

/**
 * Retrieve a subscription from Stripe
 */
export async function getStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving Stripe subscription:', error);
    return null;
  }
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  
  return subscription;
}

/**
 * Reactivate a subscription that was set to cancel
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
  
  return subscription;
}

/**
 * Update subscription to a new plan
 */
export async function updateSubscription(params: {
  subscriptionId: string;
  newPriceId: string;
}): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(params.subscriptionId);
  
  const updatedSubscription = await stripe.subscriptions.update(params.subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: params.newPriceId,
      },
    ],
    proration_behavior: 'always_invoice',
  });
  
  return updatedSubscription;
}

/**
 * Format amount from cents to dollars
 */
export function formatAmount(amountInCents: number): string {
  return `$${(amountInCents / 100).toFixed(2)}`;
}

/**
 * Check if a feature is available for a plan
 */
export function isFeatureAvailable(
  plan: SubscriptionPlan,
  feature: keyof typeof PLAN_CONFIG.collector.features
): boolean {
  return PLAN_CONFIG[plan].features[feature];
}

/**
 * Get limit for a plan feature
 */
export function getLimit(
  plan: SubscriptionPlan,
  limit: keyof typeof PLAN_CONFIG.collector.limits
): number {
  return PLAN_CONFIG[plan].limits[limit];
}

/**
 * Check if usage is within limits (-1 means unlimited)
 */
export function isWithinLimit(
  currentUsage: number,
  limit: number
): boolean {
  if (limit === -1) return true; // Unlimited
  return currentUsage < limit;
}
