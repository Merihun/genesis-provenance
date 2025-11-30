/**
 * Mock AI Analysis Engine
 * 
 * This module simulates AI-powered authentication analysis for luxury assets.
 * It provides realistic analysis results for demonstration and testing purposes.
 * 
 * In production, this would be replaced with actual Computer Vision API calls
 * to services like Google Cloud Vision AI or AWS Rekognition.
 */

import { FraudRiskLevel } from '@prisma/client';

interface ItemData {
  id: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  serialNumber?: string | null;
  vin?: string | null;
  referenceNumber?: string | null;
  purchasePrice?: number | null;
  estimatedValue?: number | null;
  category: {
    name: string;
    slug: string;
  };
}

interface AnalysisResult {
  confidenceScore: number;
  fraudRiskLevel: FraudRiskLevel;
  findings: {
    summary: string;
    overallAssessment: string;
    keyObservations: string[];
  };
  counterfeitIndicators: {
    found: boolean;
    items: Array<{
      indicator: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
  };
  authenticityMarkers: {
    found: boolean;
    items: Array<{
      marker: string;
      confidence: 'low' | 'medium' | 'high';
      description: string;
    }>;
  };
  processingTime: number;
}

/**
 * Simulates AI analysis processing delay
 */
async function simulateProcessing(): Promise<void> {
  const delay = 1500 + Math.random() * 1500; // 1.5-3 seconds
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Get category-specific counterfeit indicators
 */
function getCategoryIndicators(categorySlug: string, item: ItemData): Array<{
  indicator: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}> {
  const indicators: Array<{
    indicator: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }> = [];

  // Randomly decide if we'll add warning indicators (20% chance)
  const hasIssues = Math.random() < 0.2;

  if (!hasIssues) return [];

  switch (categorySlug) {
    case 'luxury-watches':
      if (Math.random() < 0.5) {
        indicators.push({
          indicator: 'Dial Font Inconsistency',
          severity: 'medium',
          description: 'Minor variations detected in logo font weight compared to reference images'
        });
      }
      if (Math.random() < 0.3) {
        indicators.push({
          indicator: 'Case Back Markings',
          severity: 'low',
          description: 'Engraving depth appears slightly shallower than typical for this model'
        });
      }
      break;

    case 'luxury-cars':
      if (Math.random() < 0.4) {
        indicators.push({
          indicator: 'VIN Plate Condition',
          severity: 'medium',
          description: 'VIN plate shows signs of removal or replacement'
        });
      }
      if (Math.random() < 0.3) {
        indicators.push({
          indicator: 'Paint Thickness Variance',
          severity: 'low',
          description: 'Inconsistent paint thickness measurements across body panels'
        });
      }
      break;

    case 'designer-handbags':
      if (Math.random() < 0.4) {
        indicators.push({
          indicator: 'Stitching Irregularity',
          severity: 'medium',
          description: 'Stitch count and pattern deviates from manufacturer specifications'
        });
      }
      if (Math.random() < 0.3) {
        indicators.push({
          indicator: 'Hardware Finish',
          severity: 'low',
          description: 'Metal hardware shows slight discoloration inconsistent with authentic pieces'
        });
      }
      break;

    case 'fine-jewelry':
      if (Math.random() < 0.3) {
        indicators.push({
          indicator: 'Hallmark Clarity',
          severity: 'medium',
          description: 'Precious metal hallmarks appear less crisp than expected'
        });
      }
      if (Math.random() < 0.4) {
        indicators.push({
          indicator: 'Stone Setting Quality',
          severity: 'low',
          description: 'Minor inconsistencies in prong work and stone alignment'
        });
      }
      break;

    case 'fine-art':
      if (Math.random() < 0.3) {
        indicators.push({
          indicator: 'Signature Analysis',
          severity: 'medium',
          description: 'Artist signature shows minor stylistic differences from known examples'
        });
      }
      if (Math.random() < 0.2) {
        indicators.push({
          indicator: 'Canvas Aging',
          severity: 'low',
          description: 'Canvas aging patterns inconsistent with claimed date of creation'
        });
      }
      break;

    default:
      if (Math.random() < 0.3) {
        indicators.push({
          indicator: 'Material Quality',
          severity: 'low',
          description: 'Some material characteristics differ slightly from reference standards'
        });
      }
  }

  return indicators;
}

/**
 * Get category-specific authenticity markers
 */
function getAuthenticityMarkers(categorySlug: string, item: ItemData): Array<{
  marker: string;
  confidence: 'low' | 'medium' | 'high';
  description: string;
}> {
  const markers: Array<{
    marker: string;
    confidence: 'low' | 'medium' | 'high';
    description: string;
  }> = [];

  switch (categorySlug) {
    case 'luxury-watches':
      markers.push(
        {
          marker: 'Movement Analysis',
          confidence: 'high',
          description: 'Movement components and finishing match manufacturer specifications'
        },
        {
          marker: 'Serial Number Verification',
          confidence: 'high',
          description: 'Serial number format, placement, and engraving style are authentic'
        },
        {
          marker: 'Material Testing',
          confidence: 'medium',
          description: 'Case material composition consistent with stated specifications'
        }
      );
      break;

    case 'luxury-cars':
      markers.push(
        {
          marker: 'VIN Decode Match',
          confidence: 'high',
          description: 'VIN decoding confirms model, year, and manufacturing details'
        },
        {
          marker: 'Chassis Stampings',
          confidence: 'high',
          description: 'Factory chassis stampings display correct format and patina'
        }
      );
      if (item.vin) {
        markers.push({
          marker: 'Numbers Matching',
          confidence: 'high',
          description: 'Engine and transmission numbers match original factory records'
        });
      }
      break;

    case 'designer-handbags':
      markers.push(
        {
          marker: 'Date Code Validation',
          confidence: 'high',
          description: 'Date code format and location consistent with manufacturer standards'
        },
        {
          marker: 'Material Quality',
          confidence: 'high',
          description: 'Leather grain, texture, and finish match authentic specifications'
        },
        {
          marker: 'Hardware Stamps',
          confidence: 'medium',
          description: 'Zipper pulls and hardware bear correct manufacturer markings'
        }
      );
      break;

    case 'fine-jewelry':
      markers.push(
        {
          marker: 'Metal Composition',
          confidence: 'high',
          description: 'Precious metal testing confirms stated karat/purity'
        },
        {
          marker: 'Gemstone Certification',
          confidence: 'high',
          description: 'Stone characteristics match provided certification documents'
        },
        {
          marker: 'Maker Marks',
          confidence: 'medium',
          description: 'Maker\'s marks and hallmarks consistent with time period and origin'
        }
      );
      break;

    case 'fine-art':
      markers.push(
        {
          marker: 'Provenance Documentation',
          confidence: 'high',
          description: 'Chain of ownership documented with gallery receipts and auction records'
        },
        {
          marker: 'Material Analysis',
          confidence: 'medium',
          description: 'Paint composition and canvas type consistent with artist\'s known period'
        },
        {
          marker: 'Stylistic Analysis',
          confidence: 'medium',
          description: 'Brushwork and composition align with artist\'s documented techniques'
        }
      );
      break;

    default:
      markers.push(
        {
          marker: 'Documentation Review',
          confidence: 'medium',
          description: 'Provided documentation appears legitimate and consistent'
        },
        {
          marker: 'Physical Condition',
          confidence: 'medium',
          description: 'Wear patterns and aging consistent with stated age and use'
        }
      );
  }

  return markers;
}

/**
 * Calculate fraud risk level based on indicators
 */
function calculateFraudRisk(
  indicators: Array<{ severity: string }>,
  confidenceScore: number
): FraudRiskLevel {
  if (indicators.length === 0 && confidenceScore >= 90) {
    return FraudRiskLevel.low;
  }

  const highSeverityCount = indicators.filter(i => i.severity === 'high').length;
  const mediumSeverityCount = indicators.filter(i => i.severity === 'medium').length;

  if (highSeverityCount >= 2 || confidenceScore < 70) {
    return FraudRiskLevel.critical;
  }

  if (highSeverityCount === 1 || mediumSeverityCount >= 3) {
    return FraudRiskLevel.high;
  }

  if (mediumSeverityCount >= 1 || confidenceScore < 85) {
    return FraudRiskLevel.medium;
  }

  return FraudRiskLevel.low;
}

/**
 * Generate mock AI analysis result
 * 
 * @param item - Item data including category information
 * @param imageIds - Array of media asset IDs being analyzed
 * @returns Simulated analysis result
 */
export async function generateMockAnalysis(
  item: ItemData,
  imageIds: string[]
): Promise<AnalysisResult> {
  const startTime = Date.now();

  // Simulate processing time
  await simulateProcessing();

  // Get category-specific indicators and markers
  const indicators = getCategoryIndicators(item.category.slug, item);
  const markers = getAuthenticityMarkers(item.category.slug, item);

  // Calculate confidence score (70-98%)
  // Higher scores if no indicators found
  const baseScore = indicators.length === 0 ? 90 : 75;
  const variance = Math.random() * 8;
  const confidenceScore = Math.min(98, Math.round(baseScore + variance));

  // Calculate fraud risk
  const fraudRiskLevel = calculateFraudRisk(indicators, confidenceScore);

  // Generate assessment
  const hasIssues = indicators.length > 0;
  const overallAssessment = hasIssues
    ? `Analysis detected ${indicators.length} area(s) requiring attention. Further expert examination is recommended.`
    : 'No significant irregularities detected. All analyzed features consistent with authentic specimen.';

  const keyObservations: string[] = [
    `Analyzed ${imageIds.length} high-resolution image(s)`,
    `Identified ${markers.length} positive authenticity marker(s)`,
  ];

  if (hasIssues) {
    keyObservations.push(`Flagged ${indicators.length} potential concern(s) for review`);
  }

  if (item.brand) {
    keyObservations.push(`Brand characteristics consistent with ${item.brand} standards`);
  }

  const processingTime = Date.now() - startTime;

  return {
    confidenceScore,
    fraudRiskLevel,
    findings: {
      summary: hasIssues
        ? `AI analysis confidence: ${confidenceScore}%. Manual expert review recommended.`
        : `AI analysis confidence: ${confidenceScore}%. Strong authenticity indicators detected.`,
      overallAssessment,
      keyObservations,
    },
    counterfeitIndicators: {
      found: indicators.length > 0,
      items: indicators,
    },
    authenticityMarkers: {
      found: markers.length > 0,
      items: markers,
    },
    processingTime,
  };
}

/**
 * Get educational content about what AI authentication checks
 */
export function getAIAuthenticationInfo(categorySlug: string): {
  title: string;
  description: string;
  checksPerformed: string[];
} {
  const commonChecks = [
    'High-resolution image analysis',
    'Material texture and finish inspection',
    'Manufacturing mark verification',
    'Wear pattern consistency analysis',
  ];

  let categorySpecificChecks: string[] = [];

  switch (categorySlug) {
    case 'luxury-watches':
      categorySpecificChecks = [
        'Movement component analysis',
        'Dial and hand finishing inspection',
        'Case back engraving verification',
        'Crown and clasp authentication',
      ];
      break;
    case 'luxury-cars':
      categorySpecificChecks = [
        'VIN plate and chassis number analysis',
        'Body panel alignment and gaps',
        'Paint thickness measurements',
        'Interior trim and upholstery verification',
      ];
      break;
    case 'designer-handbags':
      categorySpecificChecks = [
        'Stitching pattern and count analysis',
        'Hardware finish and stamps',
        'Date code and serial number validation',
        'Leather grain pattern verification',
      ];
      break;
    case 'fine-jewelry':
      categorySpecificChecks = [
        'Precious metal hallmark analysis',
        'Gemstone setting and prong work',
        'Clasp and closure mechanism verification',
        'Surface finish and polish consistency',
      ];
      break;
    case 'fine-art':
      categorySpecificChecks = [
        'Signature and marking analysis',
        'Canvas and frame inspection',
        'Brushstroke and technique verification',
        'Aging and patina consistency',
      ];
      break;
    default:
      categorySpecificChecks = [
        'Surface condition and finish',
        'Component quality assessment',
        'Age-appropriate wear patterns',
        'Documentation review',
      ];
  }

  return {
    title: 'AI-Powered Authentication',
    description:
      'Our AI authentication system uses advanced computer vision and machine learning to analyze multiple aspects of your luxury asset. While AI provides rapid initial assessment, we always recommend expert verification for high-value items.',
    checksPerformed: [...commonChecks, ...categorySpecificChecks],
  };
}
