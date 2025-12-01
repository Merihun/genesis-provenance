import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFileUrl } from '@/lib/s3';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch the item with related data
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        organization: {
          select: {
            name: true,
            type: true,
          },
        },
        mediaAssets: {
          where: {
            isPublic: true, // Only include public media
          },
          select: {
            id: true,
            cloudStoragePath: true,
            type: true,
            isPublic: true,
          },
          take: 5,
        },
        aiAnalyses: {
          where: {
            status: 'completed',
          },
          orderBy: {
            requestedAt: 'desc',
          },
          take: 1,
          select: {
            status: true,
            confidenceScore: true,
            fraudRiskLevel: true,
          },
        },
        provenanceEvents: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Only allow public access to verified assets
    if (item.status !== 'verified') {
      return NextResponse.json(
        { error: 'This asset is not publicly accessible' },
        { status: 403 }
      );
    }

    // Generate signed URLs for media assets
    const mediaAssetsWithUrls = await Promise.all(
      item.mediaAssets.map(async (media: any) => {
        const url = await getFileUrl(media.cloudStoragePath, media.isPublic);
        return {
          id: media.id,
          url,
          mediaType: media.type,
        };
      })
    );

    // Build the public asset response
    const publicAsset = {
      id: item.id,
      brand: item.brand,
      model: item.model,
      year: item.year,
      category: item.category,
      status: item.status,
      vin: item.vin,
      serialNumber: item.serialNumber,
      estimatedValue: item.estimatedValue,
      createdAt: item.createdAt,
      organization: item.organization,
      provenanceEventCount: item.provenanceEvents.length,
      mediaAssets: mediaAssetsWithUrls,
      aiAnalysis: item.aiAnalyses[0] || null,
    };

    return NextResponse.json({ asset: publicAsset });
  } catch (error: any) {
    console.error('Error fetching public asset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset', details: error.message },
      { status: 500 }
    );
  }
}
