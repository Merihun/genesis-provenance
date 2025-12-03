import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/ai-analyses
 * Fetch all AI analyses (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const fraudRiskLevel = searchParams.get('fraudRiskLevel');

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (fraudRiskLevel) {
      where.fraudRiskLevel = fraudRiskLevel;
    }

    // Fetch analyses
    const analyses = await prisma.aIAnalysis.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            brand: true,
            model: true,
            makeModel: true,
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
      take: 100, // Limit to 100 most recent
    });

    // Get statistics
    const stats = await prisma.aIAnalysis.groupBy({
      by: ['status'],
      _count: true,
    });

    const fraudStats = await prisma.aIAnalysis.groupBy({
      by: ['fraudRiskLevel'],
      where: {
        status: 'completed',
      },
      _count: true,
    });

    return NextResponse.json({
      analyses,
      stats: {
        byStatus: stats.reduce((acc: any, stat: any) => {
          acc[stat.status] = stat._count;
          return acc;
        }, {}),
        byFraudRisk: fraudStats.reduce((acc: any, stat: any) => {
          if (stat.fraudRiskLevel) {
            acc[stat.fraudRiskLevel] = stat._count;
          }
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Error fetching AI analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}
