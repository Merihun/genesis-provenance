import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { analyzeUploadedImage } from '@/lib/smart-upload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/smart-upload/batch
 * Analyze multiple images at once for batch asset registration
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const files: File[] = [];
    const category = formData.get('category') as string | null;

    // Extract all image files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image') && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No image files provided' },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 images allowed per batch' },
        { status: 400 }
      );
    }

    // Analyze all images in parallel
    const analysisPromises = files.map(async (file, index) => {
      try {
        // Validate file
        if (!file.type.startsWith('image/')) {
          return {
            index,
            fileName: file.name,
            success: false,
            error: 'File is not an image',
          };
        }

        if (file.size > 10 * 1024 * 1024) {
          return {
            index,
            fileName: file.name,
            success: false,
            error: 'File size exceeds 10MB limit',
          };
        }

        // Convert to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Analyze image
        const analysis = await analyzeUploadedImage(buffer, category || undefined);

        return {
          index,
          fileName: file.name,
          success: true,
          extracted: analysis.extracted,
          quality: analysis.quality,
        };
      } catch (error) {
        console.error(`Error analyzing image ${index}:`, error);
        return {
          index,
          fileName: file.name,
          success: false,
          error: 'Failed to analyze image',
        };
      }
    });

    const results = await Promise.all(analysisPromises);

    // Separate successful and failed analyses
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Group results by detected brand (for auto-categorization)
    const groupedByBrand: Record<string, any[]> = {};
    successful.forEach(result => {
      const detectedBrand = result.extracted?.brand || 'unknown';
      if (!groupedByBrand[detectedBrand]) {
        groupedByBrand[detectedBrand] = [];
      }
      groupedByBrand[detectedBrand].push(result);
    });

    return NextResponse.json({
      total: files.length,
      successful: successful.length,
      failed: failed.length,
      results: {
        successful,
        failed,
      },
      groupedByBrand,
      processingTime: Date.now(), // Timestamp for tracking
    });
  } catch (error) {
    console.error('Batch upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process batch upload' },
      { status: 500 }
    );
  }
}
