import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { analyzeUploadedImage } from '@/lib/smart-upload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/smart-upload/analyze
 * Analyze an uploaded image using AI to extract luxury asset information
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const category = formData.get('category') as string;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    console.log(`[Smart Upload] Analyzing image: ${imageFile.name} (${imageFile.size} bytes)`);

    // Convert file to buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Analyze the image
    const { extracted, quality } = await analyzeUploadedImage(buffer, category);

    console.log('[Smart Upload] Analysis complete:', {
      extracted: {
        brand: extracted.brand,
        model: extracted.model,
        serialNumber: extracted.serialNumber,
      },
      quality: quality.overall,
    });

    return NextResponse.json({
      success: true,
      extracted,
      quality,
    });
  } catch (error) {
    console.error('[Smart Upload] Error analyzing image:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
