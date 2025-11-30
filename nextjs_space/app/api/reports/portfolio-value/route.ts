/**
 * API Route: Portfolio Value Report PDF
 * GET /api/reports/portfolio-value
 * Generates a financial summary report suitable for insurance/appraisals
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
  PDF_COLORS,
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query filters
    const where: any = {
      organizationId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Fetch items with financial data
    const items = await prisma.item.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        estimatedValue: 'desc',
      },
    });

    // Fetch organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    // Calculate comprehensive statistics
    const totalPurchasePrice = items.reduce(
      (sum: number, item: any) => sum + (Number(item.purchasePrice) || 0),
      0
    );
    const totalEstimatedValue = items.reduce(
      (sum: number, item: any) => sum + (Number(item.estimatedValue) || 0),
      0
    );
    const totalAppreciation = totalEstimatedValue - totalPurchasePrice;
    const appreciationPercent =
      totalPurchasePrice > 0
        ? ((totalAppreciation / totalPurchasePrice) * 100).toFixed(2)
        : '0.00';

    const verifiedItems = items.filter((item: any) => item.status === ItemStatus.verified);
    const verifiedValue = verifiedItems.reduce(
      (sum: number, item: any) => sum + (Number(item.estimatedValue) || 0),
      0
    );

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    addPDFHeader(
      doc,
      'Portfolio Value Report',
      'Insurance & Appraisal Documentation'
    );

    // Organization & Report Info
    addSectionDivider(doc, 'Report Information');
    addKeyValueRow(doc, 'Organization', organization?.name || 'N/A');
    addKeyValueRow(doc, 'Report Date', formatDate(new Date()));
    if (startDate && endDate) {
      addKeyValueRow(
        doc,
        'Date Range',
        `${formatDate(new Date(startDate), 'short')} - ${formatDate(new Date(endDate), 'short')}`
      );
    }
    addKeyValueRow(doc, 'Total Assets', items.length.toString());
    addKeyValueRow(doc, 'Verified Assets', verifiedItems.length.toString());
    doc.moveDown(1);

    // Financial Summary
    addSectionDivider(doc, 'Financial Summary');
    addKeyValueRow(doc, 'Total Purchase Cost', formatCurrency(totalPurchasePrice));
    addKeyValueRow(doc, 'Current Estimated Value', formatCurrency(totalEstimatedValue));
    addKeyValueRow(
      doc,
      'Total Appreciation',
      `${formatCurrency(totalAppreciation)} (${appreciationPercent}%)`
    );
    addKeyValueRow(doc, 'Verified Asset Value', formatCurrency(verifiedValue));
    addKeyValueRow(
      doc,
      'Average Asset Value',
      formatCurrency(items.length > 0 ? totalEstimatedValue / items.length : 0)
    );
    doc.moveDown(1);

    // Value by Category
    addSectionDivider(doc, 'Value Distribution by Category');
    const categoryGroups = items.reduce((acc: any, item: any) => {
      const categoryName = item.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          count: 0,
          purchaseValue: 0,
          estimatedValue: 0,
        };
      }
      acc[categoryName].count++;
      acc[categoryName].purchaseValue += Number(item.purchasePrice) || 0;
      acc[categoryName].estimatedValue += Number(item.estimatedValue) || 0;
      return acc;
    }, {});

    const categoryRows = Object.entries(categoryGroups)
      .map(([name, data]: [string, any]) => {
        const appreciation = data.estimatedValue - data.purchaseValue;
        return [
          name,
          data.count.toString(),
          formatCurrency(data.estimatedValue),
          formatCurrency(appreciation),
          `${totalEstimatedValue > 0 ? ((data.estimatedValue / totalEstimatedValue) * 100).toFixed(1) : 0}%`,
        ];
      })
      .sort((a: any, b: any) => {
        // Sort by estimated value (index 2)
        const valA = parseFloat(a[2].replace(/[$,]/g, ''));
        const valB = parseFloat(b[2].replace(/[$,]/g, ''));
        return valB - valA;
      });

    addTable(
      doc,
      ['Category', 'Count', 'Current Value', 'Appreciation', '% Portfolio'],
      categoryRows,
      [120, 60, 110, 110, 95]
    );

    doc.moveDown(1);

    // Detailed Asset Listing
    if (items.length > 0) {
      doc.addPage();
      addSectionDivider(doc, 'Detailed Asset Valuation');

      const assetRows = items.map((item: any) => [
        `${item.brand || ''} ${item.model || ''}`.trim() || 'Untitled',
        item.category.name,
        item.year?.toString() || 'N/A',
        formatCurrency(item.purchasePrice),
        formatCurrency(item.estimatedValue),
      ]);

      addTable(
        doc,
        ['Asset Description', 'Category', 'Year', 'Purchase', 'Current Value'],
        assetRows,
        [150, 90, 50, 100, 105]
      );
    }

    doc.moveDown(2);

    // Disclaimer
    doc
      .fontSize(9)
      .fillColor('#666666')
      .text(
        'DISCLAIMER: This report is for informational purposes only. Values shown are estimated and should be independently verified for insurance or appraisal purposes. Genesis Provenance does not guarantee the accuracy of estimated values and is not liable for any decisions made based on this report.',
        50,
        doc.page.height - 120,
        { align: 'center', width: doc.page.width - 100 }
      );

    // Confidentiality notice
    doc
      .fontSize(10)
      .fillColor(PDF_COLORS.primary)
      .text(
        'CONFIDENTIAL - For intended recipient only',
        50,
        doc.page.height - 80,
        { align: 'center', width: doc.page.width - 100 }
      );

    // Finalize PDF
    await new Promise<void>((resolve, reject) => {
      doc.on('end', () => resolve());
      doc.on('error', reject);
      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);
    const filename = `genesis-provenance-portfolio-value-${new Date().toISOString().split('T')[0]}.pdf`;

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Portfolio value report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate portfolio value report' },
      { status: 500 }
    );
  }
}
