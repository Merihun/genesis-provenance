/**
 * API Route: Collection PDF Report
 * GET /api/reports/collection
 * Generates a comprehensive collection overview PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import PDFDocument from 'pdfkit';
import {
  formatCurrency,
  formatDate,
  addPDFHeader,
  addSectionDivider,
  addKeyValueRow,
  addTable,
} from '@/lib/pdf-generator';
import { ItemStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;
    
    if (!session?.user || !organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all items with related data
    const items = await prisma.item.findMany({
      where: {
        organizationId,
      },
      include: {
        category: true,
        provenanceEvents: {
          orderBy: { occurredAt: 'desc' },
          take: 1, // Latest event per item
        },
      },
      orderBy: {
        estimatedValue: 'desc',
      },
    });

    // Fetch organization details
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    // Calculate statistics
    const totalValue = items.reduce(
      (sum: number, item: any) => sum + (Number(item.estimatedValue) || 0),
      0
    );
    const verifiedCount = items.filter((item: any) => item.status === ItemStatus.verified).length;
    const pendingCount = items.filter(
      (item: any) => item.status === ItemStatus.pending
    ).length;

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    addPDFHeader(doc, 'Collection Overview Report', 'Comprehensive Portfolio Summary');

    // Organization Info
    addSectionDivider(doc, 'Organization Details');
    addKeyValueRow(doc, 'Organization', organization?.name || 'N/A');
    addKeyValueRow(doc, 'Report Date', formatDate(new Date()));
    addKeyValueRow(doc, 'Total Assets', items.length.toString());
    doc.moveDown(1);

    // Portfolio Summary
    addSectionDivider(doc, 'Portfolio Summary');
    addKeyValueRow(doc, 'Total Portfolio Value', formatCurrency(totalValue));
    addKeyValueRow(
      doc,
      'Average Asset Value',
      formatCurrency(items.length > 0 ? totalValue / items.length : 0)
    );
    addKeyValueRow(doc, 'Verified Assets', `${verifiedCount} (${items.length > 0 ? Math.round((verifiedCount / items.length) * 100) : 0}%)`);
    addKeyValueRow(doc, 'Pending Review', `${pendingCount} assets`);
    doc.moveDown(1);

    // Category Breakdown
    addSectionDivider(doc, 'Category Breakdown');
    const categoryGroups = items.reduce((acc: any, item: any) => {
      const categoryName = item.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = { count: 0, value: 0 };
      }
      acc[categoryName].count++;
      acc[categoryName].value += Number(item.estimatedValue) || 0;
      return acc;
    }, {});

    const categoryRows = Object.entries(categoryGroups).map(([name, data]: [string, any]) => [
      name,
      data.count.toString(),
      formatCurrency(data.value),
      `${totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : 0}%`,
    ]);

    addTable(
      doc,
      ['Category', 'Count', 'Total Value', '% of Portfolio'],
      categoryRows,
      [180, 80, 120, 115]
    );

    doc.moveDown(1);

    // Top 10 Assets by Value
    addSectionDivider(doc, 'Top 10 Assets by Estimated Value');
    const topAssets = items.slice(0, 10);

    if (topAssets.length > 0) {
      const assetRows = topAssets.map((item: any) => [
        `${item.brand || ''} ${item.model || ''}`.trim() || 'Untitled',
        item.category.name,
        formatCurrency(item.estimatedValue),
        item.status.replace('_', ' '),
      ]);

      addTable(
        doc,
        ['Asset', 'Category', 'Value', 'Status'],
        assetRows,
        [180, 100, 100, 115]
      );
    } else {
      doc.fontSize(12).text('No assets found.', 50);
    }

    doc.moveDown(2);

    // Footer note
    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(
        'This report is confidential and intended solely for the use of the organization listed above.',
        50,
        doc.page.height - 100,
        { align: 'center', width: doc.page.width - 100 }
      );

    // Finalize PDF
    await new Promise<void>((resolve, reject) => {
      doc.on('end', () => resolve());
      doc.on('error', reject);
      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);
    const filename = `genesis-provenance-collection-${new Date().toISOString().split('T')[0]}.pdf`;

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Collection report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate collection report' },
      { status: 500 }
    );
  }
}
