import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { parseCSV } from '@/lib/bulk-import';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/bulk-import/upload
 * Uploads and parses CSV file, stores import session
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

    // Parse FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const categoryId = formData.get('categoryId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && !file.type.includes('csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Read file content
    const csvContent = await file.text();

    // Parse CSV
    const parseResult = parseCSV(csvContent);

    // Create bulk import record
    const importData: any = {
      organizationId,
      userId: (session.user as any).id,
      fileName: file.name,
      fileSize: file.size,
      totalRows: parseResult.totalRows,
      status: 'pending',
      columnMapping: parseResult.suggestedMapping,
    };

    // Only include categoryId if it's provided
    if (categoryId) {
      importData.categoryId = categoryId;
    }

    const bulkImport = await prisma.bulkImport.create({
      data: importData,
    });

    return NextResponse.json({
      success: true,
      importId: bulkImport.id,
      parseResult: {
        headers: parseResult.headers,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        invalidRows: parseResult.invalidRows,
        suggestedMapping: parseResult.suggestedMapping,
        preview: parseResult.rows.slice(0, 5), // First 5 rows for preview
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
