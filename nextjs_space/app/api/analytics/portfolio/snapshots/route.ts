import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/portfolio/snapshots
 * Retrieve historical portfolio snapshots
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = (session.user as any)?.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch snapshots
    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: {
        organizationId,
        snapshotDate: { gte: startDate },
      },
      orderBy: { snapshotDate: 'desc' },
      take: limit,
    });

    // Format response
    const formattedSnapshots = snapshots.map((snapshot: any) => ({
      id: snapshot.id,
      totalValue: parseFloat(snapshot.totalValue.toString()),
      totalItems: snapshot.totalItems,
      verifiedItems: snapshot.verifiedItems,
      pendingItems: snapshot.pendingItems,
      categoryBreakdown: snapshot.categoryBreakdown,
      statusBreakdown: snapshot.statusBreakdown,
      snapshotDate: snapshot.snapshotDate.toISOString(),
      createdAt: snapshot.createdAt.toISOString(),
    }));

    return NextResponse.json({
      snapshots: formattedSnapshots,
      count: formattedSnapshots.length,
      periodDays: days,
    });
  } catch (error: any) {
    console.error('Error fetching portfolio snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio snapshots', details: error.message },
      { status: 500 }
    );
  }
}
