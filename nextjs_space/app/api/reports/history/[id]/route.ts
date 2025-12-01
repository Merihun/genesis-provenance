import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/history/[id]
 * Re-export using saved export configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Fetch export history
    const exportRecord = await prisma.exportHistory.findUnique({
      where: { id: params.id },
    });

    if (!exportRecord || exportRecord.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Export not found or access denied' },
        { status: 404 }
      );
    }

    if (!exportRecord.canReExport) {
      return NextResponse.json(
        { error: 'This export cannot be regenerated' },
        { status: 400 }
      );
    }

    // Return the export configuration for re-export
    return NextResponse.json({
      id: exportRecord.id,
      template: exportRecord.template,
      format: exportRecord.format,
      filters: exportRecord.filters,
      canReExport: exportRecord.canReExport,
    });
  } catch (error: any) {
    console.error('Error fetching export for re-export:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export configuration', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/history/[id]
 * Delete a specific export history entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if export exists and belongs to user's organization
    const exportRecord = await prisma.exportHistory.findUnique({
      where: { id: params.id },
    });

    if (!exportRecord || exportRecord.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Export not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the export history entry
    await prisma.exportHistory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Export history entry deleted',
    });
  } catch (error: any) {
    console.error('Error deleting export history:', error);
    return NextResponse.json(
      { error: 'Failed to delete export history', details: error.message },
      { status: 500 }
    );
  }
}
