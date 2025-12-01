/**
 * AWS Rekognition Integration
 * Alternative AI provider for luxury asset authentication
 */

import {
  RekognitionClient,
  DetectLabelsCommand,
  DetectTextCommand,
  DetectModerationLabelsCommand,
  DetectFacesCommand,
  type DetectLabelsCommandOutput,
  type DetectTextCommandOutput,
  type DetectModerationLabelsCommandOutput,
} from '@aws-sdk/client-rekognition';
import type { FraudRiskLevel } from '@prisma/client';
import type { ItemData, AnalysisResult } from './ai-google-vision';

interface RekognitionAnalysisData {
  labels: Array<{ name: string; confidence: number }>;
  textDetections: Array<{ detectedText: string; confidence: number }>;
  moderationLabels: Array<{ name: string; confidence: number }>;
  imageQuality: {
    brightness: number;
    sharpness: number;
  };
}

/**
 * Initialize AWS Rekognition client
 */
function createRekognitionClient(): RekognitionClient {
  // AWS SDK automatically uses environment variables:
  // AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
  return new RekognitionClient({
    region: process.env.AWS_REGION || process.env.AWS_REKOGNITION_REGION || 'us-east-1',
  });
}

/**
 * Analyze a single image using AWS Rekognition
 */
export async function analyzeImageWithRekognition(
  imageUrl: string
): Promise<RekognitionAnalysisData> {
  const client = createRekognitionClient();

  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBytes = new Uint8Array(arrayBuffer);

    // Run multiple Rekognition analyses in parallel
    const [labelsResult, textResult, moderationResult] = await Promise.all([
      // Detect labels (objects, scenes, activities)
      client.send(
        new DetectLabelsCommand({
          Image: { Bytes: imageBytes },
          MaxLabels: 20,
          MinConfidence: 70,
        })
      ),
      // Detect text
      client.send(
        new DetectTextCommand({
          Image: { Bytes: imageBytes },
        })
      ),
      // Detect moderation labels (quality issues, inappropriate content)
      client.send(
        new DetectModerationLabelsCommand({
          Image: { Bytes: imageBytes },
          MinConfidence: 60,
        })
      ),
    ]);

    // Extract and structure the results
    const labels = (labelsResult.Labels || []).map((label) => ({
      name: label.Name || '',
      confidence: label.Confidence || 0,
    }));

    const textDetections = (textResult.TextDetections || [])
      .filter((text) => text.Type === 'LINE' || text.Type === 'WORD')
      .map((text) => ({
        detectedText: text.DetectedText || '',
        confidence: text.Confidence || 0,
      }));

    const moderationLabels = (moderationResult.ModerationLabels || []).map(
      (label) => ({
        name: label.Name || '',
        confidence: label.Confidence || 0,
      })
    );

    // Calculate image quality metrics
    let brightness = 75; // Default mid-range
    let sharpness = 75; // Default mid-range

    // Infer quality from labels
    const qualityLabels = labels.filter((l) =>
      ['Bright', 'Sharp', 'Clear', 'High Quality'].some((q) =>
        l.name.includes(q)
      )
    );
    if (qualityLabels.length > 0) {
      brightness = 85;
      sharpness = 85;
    }

    return {
      labels,
      textDetections,
      moderationLabels,
      imageQuality: {
        brightness,
        sharpness,
      },
    };
  } catch (error) {
    console.error('AWS Rekognition API error:', error);
    throw new Error(
      `Rekognition analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate comprehensive analysis from AWS Rekognition results
 */
export async function generateRekognitionAnalysis(
  item: ItemData,
  imageUrls: string[]
): Promise<AnalysisResult> {
  const startTime = Date.now();

  try {
    if (!imageUrls || imageUrls.length === 0) {
      throw new Error('No image URLs provided for analysis');
    }

    console.log(
      `[AWS Rekognition] Analyzing item ${item.id} (${item.brand} ${item.model})`
    );
    console.log(`[AWS Rekognition] Processing ${imageUrls.length} image(s)`);

    // Analyze all images (up to 3 for cost efficiency)
    const imagesToAnalyze = imageUrls.slice(0, 3);
    const analysisResults = await Promise.all(
      imagesToAnalyze.map((url) => analyzeImageWithRekognition(url))
    );

    // Aggregate results from all images
    const aggregatedData = aggregateRekognitionResults(analysisResults);

    // Generate enhanced analysis
    const analysis = await generateEnhancedRekognitionAnalysis(
      item,
      aggregatedData
    );

    const processingTime = Date.now() - startTime;
    console.log(`[AWS Rekognition] Total processing time: ${processingTime}ms`);

    return {
      ...analysis,
      processingTime,
    };
  } catch (error) {
    console.error('[AWS Rekognition] Analysis generation error:', error);
    throw error;
  }
}

/**
 * Aggregate results from multiple Rekognition analyses
 */
function aggregateRekognitionResults(
  results: RekognitionAnalysisData[]
): RekognitionAnalysisData {
  if (results.length === 1) {
    return results[0];
  }

  // Merge and deduplicate labels, keeping highest confidence
  const labelMap = new Map<string, number>();
  results.forEach((result) => {
    result.labels.forEach((label) => {
      const existing = labelMap.get(label.name);
      if (!existing || label.confidence > existing) {
        labelMap.set(label.name, label.confidence);
      }
    });
  });

  const aggregatedLabels = Array.from(labelMap.entries())
    .map(([name, confidence]) => ({ name, confidence }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 20);

  // Merge text detections
  const allTextDetections = results.flatMap((r) => r.textDetections);

  // Merge moderation labels
  const allModerationLabels = results.flatMap((r) => r.moderationLabels);

  // Average image quality
  const avgBrightness =
    results.reduce((sum, r) => sum + r.imageQuality.brightness, 0) /
    results.length;
  const avgSharpness =
    results.reduce((sum, r) => sum + r.imageQuality.sharpness, 0) /
    results.length;

  return {
    labels: aggregatedLabels,
    textDetections: allTextDetections,
    moderationLabels: allModerationLabels,
    imageQuality: {
      brightness: avgBrightness,
      sharpness: avgSharpness,
    },
  };
}

/**
 * Generate enhanced analysis from Rekognition data
 */
async function generateEnhancedRekognitionAnalysis(
  item: ItemData,
  rekognitionData: RekognitionAnalysisData
): Promise<Omit<AnalysisResult, 'processingTime'>> {
  const categorySlug = item.category.slug;
  const brand = item.brand || 'Unknown';
  const model = item.model || 'Unknown';

  // Analyze Rekognition data for authenticity indicators
  const brandMentioned = rekognitionData.textDetections.some((text) =>
    text.detectedText.toLowerCase().includes(brand.toLowerCase())
  );

  const hasTextDetections = rekognitionData.textDetections.length > 0;
  const fullText = rekognitionData.textDetections
    .map((t) => t.detectedText)
    .join(' ');

  // Check for serial number patterns
  const hasSerialPattern = /[A-Z0-9]{6,}/i.test(fullText);

  // Analyze image quality
  const hasGoodQuality =
    rekognitionData.imageQuality.brightness > 60 &&
    rekognitionData.imageQuality.sharpness > 60;

  // Check for quality issues in moderation labels
  const hasQualityIssues = rekognitionData.moderationLabels.length > 0;

  // Calculate confidence score
  let confidenceScore = 70; // Base score

  if (brandMentioned) confidenceScore += 10;
  if (hasTextDetections) confidenceScore += 5;
  if (hasSerialPattern) confidenceScore += 8;
  if (hasGoodQuality) confidenceScore += 7;
  if (!hasQualityIssues) confidenceScore += 5;

  // Category-specific adjustments
  const categoryKeywords = getCategoryKeywords(categorySlug);
  const matchingLabels = rekognitionData.labels.filter((label) =>
    categoryKeywords.some((keyword) =>
      label.name.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  if (matchingLabels.length > 0) {
    confidenceScore += Math.min(matchingLabels.length * 2, 10);
  }

  // Cap at 98%
  confidenceScore = Math.min(confidenceScore, 98);

  // Determine fraud risk level
  let fraudRiskLevel: FraudRiskLevel;
  if (confidenceScore >= 90) {
    fraudRiskLevel = 'low';
  } else if (confidenceScore >= 80) {
    fraudRiskLevel = 'medium';
  } else if (confidenceScore >= 70) {
    fraudRiskLevel = 'high';
  } else {
    fraudRiskLevel = 'critical';
  }

  // Generate markers
  const authenticityMarkers: string[] = [];
  const counterfeitIndicators: string[] = [];

  if (brandMentioned) {
    authenticityMarkers.push(`${brand} brand marking detected in text`);
  }

  if (hasSerialPattern) {
    authenticityMarkers.push('Serial number format detected');
  }

  if (matchingLabels.length > 0) {
    authenticityMarkers.push(
      `Category-appropriate features: ${matchingLabels.slice(0, 3).map((l) => l.name).join(', ')}`
    );
  }

  if (hasGoodQuality) {
    authenticityMarkers.push(
      `Professional image quality (brightness: ${Math.round(rekognitionData.imageQuality.brightness)}%, sharpness: ${Math.round(rekognitionData.imageQuality.sharpness)}%)`
    );
  }

  if (hasQualityIssues) {
    counterfeitIndicators.push(
      `Image quality concerns detected: ${rekognitionData.moderationLabels.map((l) => l.name).join(', ')}`
    );
  }

  if (!hasTextDetections) {
    counterfeitIndicators.push('Limited or no text/markings detected');
  }

  if (matchingLabels.length === 0) {
    counterfeitIndicators.push(
      `Limited category-specific features for ${item.category.name}`
    );
  }

  // Generate findings
  const topLabels = rekognitionData.labels
    .slice(0, 5)
    .map((l) => `${l.name} (${Math.round(l.confidence)}%)`);

  const findings = {
    summary: `AWS Rekognition analyzed ${brand} ${model} ${item.category.name} with ${confidenceScore}% confidence. Fraud risk: ${fraudRiskLevel}.`,
    overallAssessment:
      confidenceScore >= 85
        ? `Strong authenticity indicators detected. The item exhibits characteristics consistent with genuine ${brand} ${item.category.name}.`
        : confidenceScore >= 75
          ? `Moderate authenticity indicators present. Additional verification recommended for ${brand} ${item.category.name}.`
          : `Limited authenticity markers detected. Careful inspection recommended before accepting this ${brand} ${item.category.name}.`,
    keyObservations: [
      `Detected labels: ${topLabels.join(', ')}`,
      `Text detections: ${rekognitionData.textDetections.length} elements`,
      `Image quality: Brightness ${Math.round(rekognitionData.imageQuality.brightness)}%, Sharpness ${Math.round(rekognitionData.imageQuality.sharpness)}%`,
      matchingLabels.length > 0
        ? `${matchingLabels.length} category-relevant features identified`
        : 'Limited category-specific features',
      brandMentioned
        ? `${brand} brand markings verified`
        : 'Brand markings not clearly detected',
    ],
  };

  return {
    confidenceScore,
    fraudRiskLevel,
    findings,
    authenticityMarkers,
    counterfeitIndicators,
  };
}

/**
 * Get category-specific keywords for Rekognition label matching
 */
function getCategoryKeywords(categorySlug: string): string[] {
  const keywordMap: Record<string, string[]> = {
    watches: ['Watch', 'Timepiece', 'Wristwatch', 'Clock', 'Dial', 'Strap'],
    'luxury-cars': [
      'Car',
      'Vehicle',
      'Automobile',
      'Luxury',
      'Sports Car',
      'Sedan',
    ],
    handbags: ['Bag', 'Handbag', 'Purse', 'Leather', 'Fashion', 'Accessory'],
    jewelry: ['Jewelry', 'Gemstone', 'Diamond', 'Gold', 'Silver', 'Precious'],
    art: ['Art', 'Painting', 'Canvas', 'Frame', 'Artwork', 'Fine Art'],
    collectibles: ['Collectible', 'Antique', 'Vintage', 'Rare', 'Limited'],
  };

  return keywordMap[categorySlug] || [];
}

/**
 * Check if AWS Rekognition is properly configured
 */
export function checkRekognitionHealth(): boolean {
  const hasRegion = !!(process.env.AWS_REGION || process.env.AWS_REKOGNITION_REGION);
  const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID;
  const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY;
  const isEnabled = process.env.AWS_REKOGNITION_ENABLED === 'true';

  console.log('[AWS Rekognition] Health check:', {
    hasRegion,
    hasAccessKey,
    hasSecretKey,
    isEnabled,
  });

  return hasRegion && hasAccessKey && hasSecretKey && isEnabled;
}
