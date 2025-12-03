import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { parseCSV, ColumnMapping } from '@/lib/bulk-import';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const previewSchema = z.object({
  csvContent: z.string(),
  mapping: z.record(z.union([z.string(), z.null()])),
});

/**
 * POST /api/bulk-import/preview
 * Previews import with custom column mapping
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { csvContent, mapping } = previewSchema.parse(body);

    // Parse with custom mapping
    const parseResult = parseCSV(csvContent, mapping as ColumnMapping);

    return NextResponse.json({
      success: true,
      parseResult: {
        headers: parseResult.headers,
        rows: parseResult.rows,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        invalidRows: parseResult.invalidRows,
      },
    });
  } catch (error: any) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to preview import' },
      { status: 500 }
    );
  }
}
