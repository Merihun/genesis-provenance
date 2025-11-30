/**
 * API Route: CSV Export
 * GET /api/reports/export
 * Exports vault items as CSV with optional filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  generateItemsCSV,
  generatePortfolioSummaryCSV,
  generateCSVFilename,
} from '@/lib/csv-generator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;
    
    if (!session?.user || !organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exportType = searchParams.get('type') || 'full'; // 'full', 'summary'
    const categoryId = searchParams.get('category');
    const status = searchParams.get('status');
    const includeFinancials = searchParams.get('financials') !== 'false';

    // Build query filters
    const where: any = {
      organizationId,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    // Fetch items with category
    const items = await prisma.item.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate appropriate CSV
    let csvContent: string;
    let filename: string;

    if (exportType === 'summary') {
      csvContent = generatePortfolioSummaryCSV(items);
      filename = generateCSVFilename('portfolio-summary');
    } else {
      csvContent = generateItemsCSV(items, { includeFinancials });
      filename = generateCSVFilename('vault-export');
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}
