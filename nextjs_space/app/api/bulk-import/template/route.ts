import { NextResponse } from 'next/server';
import { generateCSVTemplate } from '@/lib/bulk-import';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bulk-import/template
 * Downloads a CSV template with example data
 */
export async function GET() {
  try {
    const csvContent = generateCSVTemplate(true);
    const fileName = `asset-import-template-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
