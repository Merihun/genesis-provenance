import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateMockAnalysis } from '@/lib/ai-mock';
import { AIAnalysisStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/items/[id]/ai-analysis
 * Fetch all AI analyses for an item
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = (session.user as any)?.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    const itemId = params.id;

    // Verify item ownership
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { organizationId: true },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all analyses for this item
    const analyses = await prisma.aIAnalysis.findMany({
      where: { itemId },
      include: {
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('Error fetching AI analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/items/[id]/ai-analysis
 * Request a new AI analysis for an item
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const organizationId = (session.user as any)?.organizationId;

    if (!userId || !organizationId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    const itemId = params.id;

    // Verify item ownership and fetch item data
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        category: true,
        mediaAssets: {
          where: { type: 'photo' },
          orderBy: { uploadedAt: 'asc' },
          take: 5, // Analyze up to 5 photos
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if there are any photos to analyze
    if (item.mediaAssets.length === 0) {
      return NextResponse.json(
        { error: 'At least one photo is required for AI analysis' },
        { status: 400 }
      );
    }

    // Check for recent pending analysis (within last 5 minutes)
    const recentAnalysis = await prisma.aIAnalysis.findFirst({
      where: {
        itemId,
        status: AIAnalysisStatus.pending,
        requestedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    if (recentAnalysis) {
      return NextResponse.json(
        { error: 'An analysis is already in progress. Please wait.' },
        { status: 409 }
      );
    }

    // Create new analysis record
    const analysis = await prisma.aIAnalysis.create({
      data: {
        itemId,
        requestedByUserId: userId,
        status: AIAnalysisStatus.pending,
        analyzedImageIds: item.mediaAssets.map(m => m.id),
        apiProvider: 'mock', // In production, this would be 'google-vision' or 'aws-rekognition'
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Process analysis asynchronously (in production, this would be a queue/background job)
    // For mock version, we'll process it immediately
    processAnalysis(analysis.id, item, item.mediaAssets.map(m => m.id));

    return NextResponse.json({
      message: 'AI analysis requested successfully',
      analysis,
    });
  } catch (error) {
    console.error('Error requesting AI analysis:', error);
    return NextResponse.json(
      { error: 'Failed to request analysis' },
      { status: 500 }
    );
  }
}

/**
 * Process the AI analysis (async function)
 * In production, this would be handled by a background job queue
 */
async function processAnalysis(
  analysisId: string,
  item: any,
  imageIds: string[]
) {
  try {
    // Update status to processing
    await prisma.aIAnalysis.update({
      where: { id: analysisId },
      data: { status: AIAnalysisStatus.processing },
    });

    // Generate mock analysis result
    const result = await generateMockAnalysis(item, imageIds);

    // Update analysis with results
    await prisma.aIAnalysis.update({
      where: { id: analysisId },
      data: {
        status: AIAnalysisStatus.completed,
        confidenceScore: result.confidenceScore,
        fraudRiskLevel: result.fraudRiskLevel,
        findings: result.findings as any,
        counterfeitIndicators: result.counterfeitIndicators as any,
        authenticityMarkers: result.authenticityMarkers as any,
        processingTime: result.processingTime,
        completedAt: new Date(),
      },
    });

    // Create a provenance event for the analysis
    await prisma.provenanceEvent.create({
      data: {
        itemId: item.id,
        userId: item.createdByUserId,
        eventType: 'inspection',
        title: 'AI Authentication Analysis',
        description: `AI analysis completed with ${result.confidenceScore}% confidence. Fraud risk: ${result.fraudRiskLevel}.`,
        metadata: {
          analysisId,
          confidenceScore: result.confidenceScore,
          fraudRiskLevel: result.fraudRiskLevel,
        },
        occurredAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error processing AI analysis:', error);

    // Update analysis with error
    await prisma.aIAnalysis.update({
      where: { id: analysisId },
      data: {
        status: AIAnalysisStatus.failed,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        completedAt: new Date(),
      },
    });
  }
}
