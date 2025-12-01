import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUsageTrends } from '@/lib/revenue-analytics';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/billing/usage-trends
 * 
 * Returns usage trends across all organizations for the past 30 days.
 * Identifies heavy users and organizations approaching limits.
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

    // Fetch usage trends
    const trends = await getUsageTrends();

    return NextResponse.json({
      trends,
      periodDays: 30,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Admin Usage Trends] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage trends' },
      { status: 500 }
    );
  }
}
