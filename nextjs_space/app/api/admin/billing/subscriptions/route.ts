import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/billing/subscriptions
 * 
 * Returns list of all subscriptions with filtering options:
 * - ?status=active|cancelled|past_due|trialing
 * - ?plan=collector|dealer|enterprise
 * - ?search=org name
 * - ?limit=50
 * 
 * Admin-only access
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') as SubscriptionStatus | null;
    const planFilter = searchParams.get('plan') as SubscriptionPlan | null;
    const searchQuery = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Build where clause
    const where: any = {};

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (planFilter) {
      where.plan = planFilter;
    }

    if (searchQuery) {
      where.organization = {
        name: {
          contains: searchQuery,
          mode: 'insensitive',
        },
      };
    }

    // Fetch subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            _count: {
              select: {
                users: true,
                items: true,
              },
            },
          },
        },
      },
    });

    // Get counts by status
    const statusCounts = await prisma.subscription.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Get counts by plan
    const planCounts = await prisma.subscription.groupBy({
      by: ['plan'],
      where: { status: 'active' },
      _count: { plan: true },
    });

    return NextResponse.json({
      subscriptions,
      counts: {
        byStatus: statusCounts.map(s => ({
          status: s.status,
          count: s._count.status,
        })),
        byPlan: planCounts.map(p => ({
          plan: p.plan,
          count: p._count.plan,
        })),
        total: subscriptions.length,
      },
    });
  } catch (error) {
    console.error('[Admin Subscriptions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
