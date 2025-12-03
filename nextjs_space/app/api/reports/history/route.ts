import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/history
 * Retrieve export history for the authenticated user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const organizationId = (session.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const template = searchParams.get('template');

    // Build where clause
    const where: any = { organizationId };
    if (template) {
      where.template = template;
    }

    // Fetch export history
    const exports = await prisma.exportHistory.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      exports: exports.map((exp: any) => ({
        id: exp.id,
        template: exp.template,
        format: exp.format,
        fileName: exp.fileName,
        fileSize: exp.fileSize,
        itemCount: exp.itemCount,
        filters: exp.filters,
        canReExport: exp.canReExport,
        createdAt: exp.createdAt.toISOString(),
        user: exp.user,
      })),
      count: exports.length,
    });
  } catch (error: any) {
    console.error('Error fetching export history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export history', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/history
 * Clear old export history entries (older than 90 days)
 */
export async function DELETE(request: NextRequest) {
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

    // Delete exports older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await prisma.exportHistory.deleteMany({
      where: {
        organizationId,
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error: any) {
    console.error('Error clearing export history:', error);
    return NextResponse.json(
      { error: 'Failed to clear export history', details: error.message },
      { status: 500 }
    );
  }
}
