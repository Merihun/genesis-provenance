import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';

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

    const organizationId = user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'No organization found' },
        { status: 400 }
      );
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, message: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get subscription
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    // Check if they have a Stripe customer ID
    const stripeCustomerId = subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      return NextResponse.json(
        {
          success: false,
          message: 'No active subscription found. Please subscribe first.',
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

    // Create Stripe Customer Portal Session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/settings/billing`,
    });

    return NextResponse.json({
      success: true,
      url: portalSession.url,
    });
  } catch (error: any) {
    console.error('Portal error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create portal session',
      },
      { status: 500 }
    );
  }
}
