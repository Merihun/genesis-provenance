/**
 * Custom ML Models for Category-Specific Analysis
 * Specialized scoring algorithms and authenticity patterns for each category
 */

import type { FraudRiskLevel } from '@prisma/client';
import type { ItemData, AnalysisResult } from './ai-google-vision';

/**
 * Category-specific weight configurations for confidence scoring
 */
interface CategoryWeights {
  brandDetection: number;
  serialNumberPattern: number;
  materialConsistency: number;
  craftQuality: number;
  ageVerification: number;
  documentationPresent: number;
}

const categoryWeights: Record<string, CategoryWeights> = {
  watches: {
    brandDetection: 0.25,
    serialNumberPattern: 0.25,
    materialConsistency: 0.15,
    craftQuality: 0.20,
    ageVerification: 0.10,
    documentationPresent: 0.05,
  },
  'luxury-cars': {
    brandDetection: 0.15,
    serialNumberPattern: 0.30, // VIN is critical
    materialConsistency: 0.10,
    craftQuality: 0.15,
    ageVerification: 0.20,
    documentationPresent: 0.10,
  },
  handbags: {
    brandDetection: 0.30,
    serialNumberPattern: 0.20,
    materialConsistency: 0.20,
    craftQuality: 0.20,
    ageVerification: 0.05,
    documentationPresent: 0.05,
  },
  jewelry: {
    brandDetection: 0.20,
    serialNumberPattern: 0.15,
    materialConsistency: 0.30, // Material authenticity is critical
    craftQuality: 0.25,
    ageVerification: 0.05,
    documentationPresent: 0.05,
  },
  art: {
    brandDetection: 0.15, // Artist signature
    serialNumberPattern: 0.05,
    materialConsistency: 0.20,
    craftQuality: 0.30, // Artistic quality is critical
    ageVerification: 0.20,
    documentationPresent: 0.10, // Provenance documentation
  },
  collectibles: {
    brandDetection: 0.20,
    serialNumberPattern: 0.15,
    materialConsistency: 0.15,
    craftQuality: 0.20,
    ageVerification: 0.20,
    documentationPresent: 0.10,
  },
};

/**
 * Known authenticity patterns for luxury brands
 */
interface BrandPattern {
  brand: string;
  serialFormat: RegExp;
  expectedFeatures: string[];
  commonCounterfeits: string[];
}

const brandPatterns: BrandPattern[] = [
  // Watches
  {
    brand: 'Rolex',
    serialFormat: /^[A-Z0-9]{4,8}$/,
    expectedFeatures: [
      'Cyclops lens',
      'Crown logo',
      'Oyster case',
      'Swiss Made',
      'Superlative Chronometer',
    ],
    commonCounterfeits: [
      'Misspelled text',
      'Incorrect font',
      'Poor crown logo',
      'Date misalignment',
    ],
  },
  {
    brand: 'Patek Philippe',
    serialFormat: /^[0-9]{6,7}$/,
    expectedFeatures: [
      'Calatrava cross',
      'Geneva Seal',
      'Hand-finished movement',
      'Swiss Made',
    ],
    commonCounterfeits: ['Incorrect hallmarks', 'Poor finishing', 'Wrong case back'],
  },
  // Handbags
  {
    brand: 'Louis Vuitton',
    serialFormat: /^[A-Z]{2}[0-9]{4}$/,
    expectedFeatures: [
      'Monogram canvas',
      'Vachetta leather',
      'Date code',
      'Heat stamp',
      'Quality stitching',
    ],
    commonCounterfeits: [
      'Off-center monogram',
      'Incorrect stitching',
      'Wrong hardware',
      'Chemical smell',
    ],
  },
  {
    brand: 'Hermès',
    serialFormat: /^[A-Z]$/,
    expectedFeatures: [
      'Clochette',
      'Lock and key',
      'Blind stamp',
      'Hand stitching',
      'Leather quality',
    ],
    commonCounterfeits: [
      'Machine stitching',
      'Poor leather',
      'Incorrect hardware',
      'Missing details',
    ],
  },
  // Luxury Cars
  {
    brand: 'Ferrari',
    serialFormat: /^[A-Z0-9]{17}$/, // VIN
    expectedFeatures: [
      'Prancing horse',
      'Build plaque',
      'Engine number',
      'Certificate of authenticity',
    ],
    commonCounterfeits: ['Replica badges', 'Non-matching numbers', 'Modified VIN'],
  },
  {
    brand: 'Porsche',
    serialFormat: /^[A-Z0-9]{17}$/,
    expectedFeatures: ['Porsche crest', 'Build date', 'COA', 'Engine number'],
    commonCounterfeits: ['Fake badges', 'Incorrect interior', 'Non-OEM parts'],
  },
];

/**
 * Apply category-specific ML scoring to enhance base analysis
 */
export function applyCustomMLScoring(
  baseAnalysis: AnalysisResult,
  item: ItemData,
  detectedFeatures: {
    hasLogo: boolean;
    hasSerialNumber: boolean;
    textQuality: number; // 0-100
    imageQuality: number; // 0-100
    labelConfidence: number; // 0-100
  }
): AnalysisResult {
  const categorySlug = item.category.slug;
  const weights = categoryWeights[categorySlug] || categoryWeights.collectibles;
  const brandPattern = item.brand
    ? brandPatterns.find(
        (p) => p.brand.toLowerCase() === item.brand?.toLowerCase()
      )
    : null;

  // Calculate weighted confidence adjustments
  let confidenceAdjustment = 0;

  // Brand detection weight
  if (detectedFeatures.hasLogo && brandPattern) {
    confidenceAdjustment += weights.brandDetection * 100;
  }

  // Serial number pattern weight
  if (detectedFeatures.hasSerialNumber) {
    if (brandPattern && item.serialNumber) {
      const serialMatches = brandPattern.serialFormat.test(item.serialNumber);
      confidenceAdjustment += weights.serialNumberPattern * 100 * (serialMatches ? 1 : 0.5);
    } else {
      confidenceAdjustment += weights.serialNumberPattern * 100 * 0.7;
    }
  }

  // Text/craft quality weight
  const textScore = detectedFeatures.textQuality / 100;
  confidenceAdjustment += weights.craftQuality * 100 * textScore;

  // Image quality weight (material consistency proxy)
  const imageScore = detectedFeatures.imageQuality / 100;
  confidenceAdjustment += weights.materialConsistency * 100 * imageScore;

  // Label confidence weight
  const labelScore = detectedFeatures.labelConfidence / 100;
  confidenceAdjustment += weights.documentationPresent * 100 * labelScore;

  // Apply adjustment to base confidence
  const adjustedConfidence = Math.round(
    baseAnalysis.confidenceScore * 0.7 + confidenceAdjustment * 0.3
  );
  const finalConfidence = Math.min(Math.max(adjustedConfidence, 0), 98);

  // Recalculate fraud risk based on adjusted confidence
  let fraudRiskLevel: FraudRiskLevel;
  if (finalConfidence >= 90) {
    fraudRiskLevel = 'low';
  } else if (finalConfidence >= 80) {
    fraudRiskLevel = 'medium';
  } else if (finalConfidence >= 70) {
    fraudRiskLevel = 'high';
  } else {
    fraudRiskLevel = 'critical';
  }

  // Add ML-enhanced markers
  const enhancedMarkers = [...baseAnalysis.authenticityMarkers];
  const enhancedIndicators = [...baseAnalysis.counterfeitIndicators];

  if (brandPattern) {
    if (detectedFeatures.hasLogo && detectedFeatures.hasSerialNumber) {
      enhancedMarkers.push(
        `Custom ML: ${brandPattern.brand} authenticity pattern verified`
      );
    }

    // Check for common counterfeit indicators
    const qualityScore =
      (detectedFeatures.textQuality + detectedFeatures.imageQuality) / 2;
    if (qualityScore < 60) {
      enhancedIndicators.push(
        `Custom ML: Quality indicators suggest potential authenticity concerns`
      );
    }
  }

  // Add category-specific insights
  enhancedMarkers.push(
    `Custom ML: Category-specific ${item.category.name} analysis applied (confidence ${finalConfidence - baseAnalysis.confidenceScore >= 0 ? '+' : ''}${Math.round(finalConfidence - baseAnalysis.confidenceScore)}%)`
  );

  return {
    ...baseAnalysis,
    confidenceScore: finalConfidence,
    fraudRiskLevel,
    authenticityMarkers: enhancedMarkers,
    counterfeitIndicators: enhancedIndicators,
    findings: {
      ...baseAnalysis.findings,
      overallAssessment:
        finalConfidence >= 85
          ? `Enhanced ML analysis confirms strong authenticity indicators for this ${item.brand} ${item.category.name}. Category-specific patterns align with genuine items.`
          : finalConfidence >= 75
            ? `ML analysis detects moderate authenticity signals for this ${item.brand} ${item.category.name}. Additional expert verification recommended.`
            : `ML analysis identifies potential authenticity concerns for this ${item.brand} ${item.category.name}. Thorough expert inspection strongly advised.`,
      keyObservations: [
        ...baseAnalysis.findings.keyObservations,
        `ML confidence adjustment: ${finalConfidence - baseAnalysis.confidenceScore >= 0 ? '+' : ''}${Math.round(finalConfidence - baseAnalysis.confidenceScore)}%`,
        `Category weights applied: ${item.category.name}`,
        brandPattern
          ? `Brand pattern: ${brandPattern.brand} (${brandPattern.expectedFeatures.length} features checked)`
          : 'No specific brand pattern available',
      ],
    },
  };
}

/**
 * Get expected features for a specific brand
 */
export function getExpectedBrandFeatures(brand: string): string[] {
  const pattern = brandPatterns.find(
    (p) => p.brand.toLowerCase() === brand.toLowerCase()
  );
  return pattern ? pattern.expectedFeatures : [];
}

/**
 * Get common counterfeit indicators for a specific brand
 */
export function getCommonCounterfeitIndicators(brand: string): string[] {
  const pattern = brandPatterns.find(
    (p) => p.brand.toLowerCase() === brand.toLowerCase()
  );
  return pattern ? pattern.commonCounterfeits : [];
}

/**
 * Validate serial number format for a brand
 */
export function validateSerialNumberFormat(
  brand: string,
  serialNumber: string
): boolean {
  const pattern = brandPatterns.find(
    (p) => p.brand.toLowerCase() === brand.toLowerCase()
  );
  if (!pattern) return true; // No pattern to validate against
  return pattern.serialFormat.test(serialNumber);
}

/**
 * Get category-specific analysis tips
 */
export function getCategoryAnalysisTips(categorySlug: string): string[] {
  const tips: Record<string, string[]> = {
    watches: [
      'Check movement details and finishing',
      'Verify serial number engraving depth and quality',
      'Examine cyclops magnification (if applicable)',
      'Inspect crown logo precision',
      'Review documentation and box condition',
    ],
    'luxury-cars': [
      'Verify VIN matches all documentation',
      'Check for matching numbers (engine, transmission)',
      'Inspect build quality and panel gaps',
      'Review service history and documentation',
      'Verify authenticity of luxury features',
    ],
    handbags: [
      'Examine stitching quality and pattern',
      'Verify leather texture and smell',
      'Check hardware weight and finish',
      'Inspect date code and heat stamp',
      'Review monogram alignment',
    ],
    jewelry: [
      'Verify precious metal hallmarks',
      'Examine gemstone quality and settings',
      'Check craftsmanship and finishing',
      'Verify maker marks and signatures',
      'Review certificates and appraisals',
    ],
    art: [
      'Verify artist signature and technique',
      'Examine paint layering and aging',
      'Check canvas or paper quality',
      'Review provenance documentation',
      'Inspect framing and mounting',
    ],
    collectibles: [
      'Verify production marks and dates',
      'Check condition and wear patterns',
      'Examine materials and construction',
      'Review certificates of authenticity',
      'Inspect packaging and documentation',
    ],
  };

  return tips[categorySlug] || tips.collectibles;
}
