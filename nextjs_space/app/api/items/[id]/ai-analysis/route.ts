import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateMockAnalysis } from '@/lib/ai-mock';
// Google Vision and AWS Rekognition are imported dynamically to avoid build issues
// import { generateGoogleVisionAnalysis } from '@/lib/ai-google-vision';
// import { generateRekognitionAnalysis } from '@/lib/ai-aws-rekognition';
import { getSignedUrlForAI } from '@/lib/s3';
import { checkFeatureAccess, trackFeatureUsage } from '@/lib/feature-gates';
import { 
  selectAIProvider, 
  isDualModeEnabled, 
  logAIComparison, 
  getProviderName,
  getAIConfigStatus 
} from '@/lib/ai-config';
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

    // Check feature access (usage limits)
    const featureCheck = await checkFeatureAccess(organizationId, 'ai_analysis');
    if (!featureCheck.allowed) {
      return NextResponse.json(
        {
          error: 'AI analysis limit reached',
          message: `You've reached your ${featureCheck.plan} plan limit of ${featureCheck.limit} AI analyses this month. Please upgrade to continue.`,
          upgradeRequired: true,
          limit: featureCheck.limit,
          current: featureCheck.current,
        },
        { status: 403 }
      );
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

    // Determine which AI provider to use based on configuration
    const selectedProvider = selectAIProvider(organizationId);
    console.log(`[AI Analysis Request] Selected provider for org ${organizationId}: ${getProviderName(selectedProvider)}`);

    // Create new analysis record
    const analysis = await prisma.aIAnalysis.create({
      data: {
        itemId,
        requestedByUserId: userId,
        status: AIAnalysisStatus.pending,
        analyzedImageIds: item.mediaAssets.map(m => m.id),
        apiProvider: selectedProvider,
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

    const organizationId = item.organizationId;
    console.log(`[AI Analysis] Starting analysis for item ${item.id} (Org: ${organizationId})`);
    console.log(`[AI Analysis] Configuration: ${getAIConfigStatus()}`);
    
    // Determine which AI provider to use based on configuration
    const selectedProvider = selectAIProvider(organizationId);
    const dualMode = isDualModeEnabled();
    
    console.log(`[AI Analysis] Selected provider: ${getProviderName(selectedProvider)}`);
    if (dualMode) {
      console.log(`[AI Analysis] Dual-mode enabled: Will run both providers for comparison`);
    }
    
    // Fetch media assets and generate signed URLs for CV APIs
    let imageUrls: string[] = [];
    
    const needsImageUrls = selectedProvider === 'google-vision' || 
                           selectedProvider === 'aws-rekognition' || 
                           dualMode;
    
    if (needsImageUrls && imageIds.length > 0) {
      try {
        // Fetch media asset records from database
        const mediaAssets = await prisma.mediaAsset.findMany({
          where: {
            id: { in: imageIds },
            type: 'photo', // Only analyze photos
          },
          select: {
            id: true,
            cloudStoragePath: true,
          },
        });
        
        console.log(`[AI Analysis] Found ${mediaAssets.length} photo(s) for item ${item.id}`);
        
        // Generate signed URLs for each image
        for (const asset of mediaAssets) {
          if (asset.cloudStoragePath) {
            try {
              const signedUrl = await getSignedUrlForAI(asset.cloudStoragePath);
              imageUrls.push(signedUrl);
              console.log(`[AI Analysis] Generated signed URL for media asset ${asset.id}`);
            } catch (urlError) {
              console.error(`[AI Analysis] Failed to generate signed URL for ${asset.id}:`, urlError);
            }
          }
        }
        
        console.log(`[AI Analysis] Generated ${imageUrls.length} signed URL(s) for CV APIs`);
      } catch (fetchError) {
        console.error(`[AI Analysis] Error fetching media assets:`, fetchError);
      }
    }
    
    // Generate analysis result using selected provider or both providers
    let result;
    let primaryResult;
    let secondaryResult;
    
    if (dualMode) {
      // Dual-mode: Run both providers in parallel for comparison
      console.log(`[AI Analysis] Running dual-mode analysis`);
      
      const primaryProviderPromise = selectedProvider === 'google-vision' && imageUrls.length > 0
        ? (async () => {
            try {
              console.warn(`[AI Analysis] Google Vision is currently disabled. Falling back to mock.`);
              // const { generateGoogleVisionAnalysis } = await import('@/lib/ai-google-vision');
              // return await generateGoogleVisionAnalysis(item, imageUrls);
              return null;
            } catch (err) {
              console.error(`[AI Analysis] Google Vision failed in dual-mode:`, err);
              return null;
            }
          })()
        : selectedProvider === 'aws-rekognition' && imageUrls.length > 0
        ? (async () => {
            try {
              console.warn(`[AI Analysis] AWS Rekognition is currently disabled. Falling back to mock.`);
              // const { generateRekognitionAnalysis } = await import('@/lib/ai-aws-rekognition');
              // return await generateRekognitionAnalysis(item, imageUrls);
              return null;
            } catch (err) {
              console.error(`[AI Analysis] AWS Rekognition failed in dual-mode:`, err);
              return null;
            }
          })()
        : Promise.resolve(null);
      
      const [primaryRes, mockRes] = await Promise.all([
        primaryProviderPromise,
        generateMockAnalysis(item, imageIds),
      ]);
      
      primaryResult = primaryRes;
      secondaryResult = mockRes;
      
      // Use primary result if available, otherwise use mock
      result = primaryResult || secondaryResult;
      
      // Log comparison
      if (primaryResult && secondaryResult) {
        const primaryProviderName = getProviderName(selectedProvider);
        logAIComparison(
          item.id, 
          organizationId, 
          primaryResult, 
          secondaryResult,
          primaryProviderName,
          'Mock AI'
        );
      }
    } else if (selectedProvider === 'google-vision') {
      console.log(`[AI Analysis] Google Vision requested but currently disabled for item ${item.id}`);
      console.warn(`[AI Analysis] Falling back to mock analysis`);
      result = await generateMockAnalysis(item, imageIds);
      // Uncomment when Google Vision dependencies are properly configured:
      // if (imageUrls.length === 0) {
      //   console.warn(`[AI Analysis] No valid image URLs, falling back to mock analysis`);
      //   result = await generateMockAnalysis(item, imageIds);
      // } else {
      //   const { generateGoogleVisionAnalysis } = await import('@/lib/ai-google-vision');
      //   result = await generateGoogleVisionAnalysis(item, imageUrls);
      // }
    } else if (selectedProvider === 'aws-rekognition') {
      console.log(`[AI Analysis] AWS Rekognition requested but currently disabled for item ${item.id}`);
      console.warn(`[AI Analysis] Falling back to mock analysis`);
      result = await generateMockAnalysis(item, imageIds);
      // Uncomment when AWS Rekognition dependencies are properly configured:
      // if (imageUrls.length === 0) {
      //   console.warn(`[AI Analysis] No valid image URLs, falling back to mock analysis`);
      //   result = await generateMockAnalysis(item, imageIds);
      // } else {
      //   const { generateRekognitionAnalysis } = await import('@/lib/ai-aws-rekognition');
      //   result = await generateRekognitionAnalysis(item, imageUrls);
      // }
    } else {
      console.log(`[AI Analysis] Using mock AI analysis for item ${item.id}`);
      result = await generateMockAnalysis(item, imageIds);
    }

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
    const apiProviderName = getProviderName(selectedProvider);
    const dualModeLabel = dualMode ? ' (Dual-Mode)' : '';
    
    await prisma.provenanceEvent.create({
      data: {
        itemId: item.id,
        userId: item.createdByUserId,
        eventType: 'inspection',
        title: `AI Authentication Analysis (${apiProviderName}${dualModeLabel})`,
        description: `AI analysis completed with ${result.confidenceScore}% confidence. Fraud risk: ${result.fraudRiskLevel}.`,
        metadata: {
          analysisId,
          confidenceScore: result.confidenceScore,
          fraudRiskLevel: result.fraudRiskLevel,
          apiProvider: apiProviderName,
          dualMode: dualMode,
        },
        occurredAt: new Date(),
      },
    });

    // Track usage for billing
    await trackFeatureUsage({
      organizationId: item.organizationId,
      feature: 'ai_analysis',
      count: 1,
      metadata: {
        itemId: item.id,
        analysisId,
        provider: apiProviderName,
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
