import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { SubscriptionPlan } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSubscriptionSchema = z.object({
  action: z.enum(['cancel', 'reactivate', 'change_plan']),
  newPlan: z.enum(['collector', 'dealer', 'enterprise']).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  reason: z.string().optional(),
});

/**
 * PATCH /api/admin/subscriptions/[id]
 * 
 * Admin endpoint to modify subscriptions:
 * - Cancel subscription
 * - Reactivate cancelled subscription
 * - Change plan
 * 
 * Admin-only access
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validatedData = updateSubscriptionSchema.parse(body);

    // Find subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
      include: { organization: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Handle different actions
    let updatedSubscription;

    switch (validatedData.action) {
      case 'cancel':
        // Cancel in Stripe
        if (subscription.stripeSubscriptionId) {
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: validatedData.cancelAtPeriodEnd !== false,
            metadata: {
              admin_action: 'cancelled',
              admin_user_id: user.id,
              reason: validatedData.reason || 'Admin action',
            },
          });
        }

        // Update in database
        updatedSubscription = await prisma.subscription.update({
          where: { id: params.id },
          data: {
            cancelAtPeriodEnd: validatedData.cancelAtPeriodEnd !== false,
            status: validatedData.cancelAtPeriodEnd === false ? 'cancelled' : subscription.status,
            canceledAt: validatedData.cancelAtPeriodEnd === false ? new Date() : null,
          },
        });
        break;

      case 'reactivate':
        // Reactivate in Stripe
        if (subscription.stripeSubscriptionId) {
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: false,
            metadata: {
              admin_action: 'reactivated',
              admin_user_id: user.id,
            },
          });
        }

        // Update in database
        updatedSubscription = await prisma.subscription.update({
          where: { id: params.id },
          data: {
            status: 'active',
            cancelAtPeriodEnd: false,
            canceledAt: null,
          },
        });
        break;

      case 'change_plan':
        if (!validatedData.newPlan) {
          return NextResponse.json(
            { error: 'newPlan is required for change_plan action' },
            { status: 400 }
          );
        }

        // Note: Changing plan in Stripe requires creating a new checkout session
        // or using subscription schedule. For simplicity, we'll just update the database
        // and recommend the customer goes through checkout for the new plan.
        
        updatedSubscription = await prisma.subscription.update({
          where: { id: params.id },
          data: {
            plan: validatedData.newPlan,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: `subscription_${validatedData.action}`,
        userId: user.id,
        resource: 'subscription',
        resourceId: subscription.id,
        details: {
          organizationId: subscription.organizationId,
          organizationName: subscription.organization.name,
          action: validatedData.action,
          newPlan: validatedData.newPlan,
          reason: validatedData.reason,
        },
      },
    });

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      message: `Subscription ${validatedData.action} successful`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Admin Subscription Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/subscriptions/[id]
 * 
 * Get detailed subscription information
 * 
 * Admin-only access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Find subscription with full details
    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
      include: {
        organization: {
          include: {
            users: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            items: {
              select: {
                id: true,
                brand: true,
                model: true,
                status: true,
              },
              take: 10,
            },
            _count: {
              select: {
                users: true,
                items: true,
              },
            },
          },
        },
        usageLogs: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Get Stripe subscription details if available
    let stripeDetails = null;
    if (subscription.stripeSubscriptionId) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );
        stripeDetails = {
          id: stripeSub.id,
          status: stripeSub.status,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
        };
      } catch (stripeError) {
        console.error('[Admin Subscription Details] Stripe error:', stripeError);
      }
    }

    return NextResponse.json({
      subscription,
      stripeDetails,
    });
  } catch (error) {
    console.error('[Admin Subscription Details] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}
