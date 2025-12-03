import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { 
  getRevenueMetrics,
  getUpgradeOpportunities,
  getCohortAnalysis 
} from '@/lib/revenue-analytics';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/billing/overview
 * 
 * Returns comprehensive billing overview including:
 * - Revenue metrics (MRR, ARR, ARPU)
 * - Churn analysis
 * - Growth trends
 * - Upgrade opportunities
 * - Cohort retention
 * 
 * Admin-only access
 */
export async function GET() {
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

    // Fetch all metrics
    const [revenueMetrics, upgradeOpportunities, cohortAnalysis] = await Promise.all([
      getRevenueMetrics(),
      getUpgradeOpportunities(),
      getCohortAnalysis(6),
    ]);

    return NextResponse.json({
      revenue: revenueMetrics,
      upgradeOpportunities,
      cohorts: cohortAnalysis,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Admin Billing Overview] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing overview' },
      { status: 500 }
    );
  }
}
