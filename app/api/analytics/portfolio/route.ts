import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getCurrentPortfolioSummary,
  getPortfolioTrends,
  getPortfolioInsights,
  getCategoryTrends,
  createPortfolioSnapshot,
} from '@/lib/portfolio-analytics';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/portfolio
 * Retrieve portfolio analytics data
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
    const days = parseInt(searchParams.get('days') || '30', 10);
    const includeInsights = searchParams.get('includeInsights') !== 'false';
    const includeCategoryTrends = searchParams.get('includeCategoryTrends') !== 'false';

    // Fetch all data in parallel
    const [summary, trends, insights, categoryTrends] = await Promise.all([
      getCurrentPortfolioSummary(organizationId),
      getPortfolioTrends(organizationId, days),
      includeInsights ? getPortfolioInsights(organizationId, Math.min(days * 3, 90)) : null,
      includeCategoryTrends ? getCategoryTrends(organizationId, days) : null,
    ]);

    return NextResponse.json({
      summary,
      trends,
      insights: insights || undefined,
      categoryTrends: categoryTrends || undefined,
      periodDays: days,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching portfolio analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio analytics', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/portfolio/snapshot
 * Create a new portfolio snapshot
 */
export async function POST(request: NextRequest) {
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

    // Create snapshot
    const snapshot = await createPortfolioSnapshot(organizationId);

    return NextResponse.json({
      success: true,
      snapshot: {
        id: snapshot.id,
        totalValue: parseFloat(snapshot.totalValue.toString()),
        totalItems: snapshot.totalItems,
        snapshotDate: snapshot.snapshotDate.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error creating portfolio snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to create portfolio snapshot', details: error.message },
      { status: 500 }
    );
  }
}
