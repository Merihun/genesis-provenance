import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { parseCSV, ColumnMapping } from '@/lib/bulk-import';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const executeSchema = z.object({
  importId: z.string(),
  csvContent: z.string(),
  mapping: z.record(z.union([z.string(), z.null()])),
  categoryId: z.string().optional(),
});

/**
 * POST /api/bulk-import/execute
 * Executes the bulk import, creating items in the database
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { importId, csvContent, mapping, categoryId } = executeSchema.parse(body);

    // Verify import belongs to user's organization
    const bulkImport = await prisma.bulkImport.findFirst({
      where: {
        id: importId,
        organizationId,
      },
    });

    if (!bulkImport) {
      return NextResponse.json(
        { error: 'Import not found' },
        { status: 404 }
      );
    }

    if (bulkImport.status !== 'pending') {
      return NextResponse.json(
        { error: 'Import has already been processed' },
        { status: 400 }
      );
    }

    // Update status to processing
    await prisma.bulkImport.update({
      where: { id: importId },
      data: { status: 'processing' },
    });

    // Parse CSV with provided mapping
    const parseResult = parseCSV(csvContent, mapping as ColumnMapping);

    // Filter valid rows
    const validRows = parseResult.rows.filter((row) => row.isValid);

    // Create items in transaction
    const errors: Array<{ rowNumber: number; error: string }> = [];
    let successCount = 0;

    for (const row of validRows) {
      try {
        const itemData: any = {
          organizationId,
          brand: row.mappedData.brand || '',
          model: row.mappedData.model || '',
          year: row.mappedData.year,
          serialNumber: row.mappedData.serialNumber,
          referenceNumber: row.mappedData.referenceNumber,
          vin: row.mappedData.vin,
          makeModel: row.mappedData.makeModel,
          matchingNumbers: row.mappedData.matchingNumbers,
          purchasePrice: row.mappedData.purchasePrice,
          purchaseDate: row.mappedData.purchaseDate,
          estimatedValue: row.mappedData.estimatedValue,
          notes: row.mappedData.notes,
          status: row.mappedData.status || 'pending',
        };

        // Only include categoryId if it's provided
        if (categoryId) {
          itemData.categoryId = categoryId;
        }

        await prisma.item.create({
          data: itemData,
        });
        successCount++;
      } catch (error: any) {
        console.error(`Error creating item for row ${row.rowNumber}:`, error);
        errors.push({
          rowNumber: row.rowNumber,
          error: error.message || 'Failed to create item',
        });
      }
    }

    // Update bulk import record
    await prisma.bulkImport.update({
      where: { id: importId },
      data: {
        status: errors.length === validRows.length ? 'failed' : 'completed',
        successRows: successCount,
        failedRows: validRows.length - successCount,
        errors: errors.length > 0 ? errors : undefined,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      result: {
        totalRows: parseResult.totalRows,
        successRows: successCount,
        failedRows: validRows.length - successCount,
        skippedRows: parseResult.invalidRows,
        errors,
      },
    });
  } catch (error: any) {
    console.error('Execute error:', error);
    
    // Try to mark import as failed
    try {
      const body = await req.clone().json();
      if (body.importId) {
        await prisma.bulkImport.update({
          where: { id: body.importId },
          data: {
            status: 'failed',
            errors: [{ error: error.message || 'Import failed' }],
            completedAt: new Date(),
          },
        });
      }
    } catch (updateError) {
      console.error('Failed to update import status:', updateError);
    }

    return NextResponse.json(
      { error: error.message || 'Failed to execute import' },
      { status: 500 }
    );
  }
}
