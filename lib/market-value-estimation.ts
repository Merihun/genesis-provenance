/**
 * Market Value Estimation Utility
 * Provides intelligent price estimation for luxury assets based on brand, model, year, condition
 */

export interface ValueEstimate {
  estimatedValue: number;
  confidence: 'low' | 'medium' | 'high';
  minValue: number;
  maxValue: number;
  source: 'database' | 'market_data' | 'heuristic';
  factors: {
    brand: number; // Brand premium multiplier
    age: number; // Age depreciation/appreciation factor
    condition: number; // Condition multiplier
    rarity: number; // Rarity premium
  };
  marketInsights?: {
    trend: 'increasing' | 'stable' | 'decreasing';
    demandLevel: 'high' | 'medium' | 'low';
    comparables: number; // Number of comparable assets found
  };
}

// Base values and multipliers by category
const BASE_VALUES: Record<string, number> = {
  watches: 5000,
  luxury_cars: 75000,
  handbags: 2500,
  jewelry: 3000,
  art: 10000,
  collectibles: 1000,
};

// Brand multipliers for watches
const WATCH_BRAND_MULTIPLIERS: Record<string, number> = {
  'rolex': 8.0,
  'patek philippe': 20.0,
  'audemars piguet': 15.0,
  'vacheron constantin': 12.0,
  'a. lange & söhne': 15.0,
  'richard mille': 25.0,
  'f.p. journe': 18.0,
  'omega': 3.0,
  'cartier': 4.0,
  'iwc': 5.0,
  'jaeger-lecoultre': 6.0,
  'breguet': 10.0,
  'blancpain': 8.0,
  'h. moser & cie': 12.0,
  'tudor': 2.5,
  'tag heuer': 1.5,
  'breitling': 2.0,
};

// Brand multipliers for luxury cars
const CAR_BRAND_MULTIPLIERS: Record<string, number> = {
  'ferrari': 25.0,
  'lamborghini': 20.0,
  'bugatti': 100.0,
  'porsche': 8.0,
  'mclaren': 15.0,
  'aston martin': 12.0,
  'bentley': 10.0,
  'rolls-royce': 15.0,
  'maybach': 18.0,
  'lotus': 5.0,
  'maserati': 6.0,
  'koenigsegg': 50.0,
  'pagani': 60.0,
  'mercedes-benz': 4.0,
  'bmw': 3.5,
  'audi': 3.0,
  'tesla': 4.5,
  'lexus': 2.5,
  'jaguar': 3.5,
};

// Brand multipliers for handbags
const HANDBAG_BRAND_MULTIPLIERS: Record<string, number> = {
  'hermès': 15.0,
  'hermes': 15.0,
  'chanel': 8.0,
  'louis vuitton': 4.0,
  'dior': 5.0,
  'gucci': 3.0,
  'prada': 3.0,
  'bottega veneta': 4.0,
  'fendi': 3.5,
  'celine': 4.0,
  'saint laurent': 3.5,
  'ysl': 3.5,
  'balenciaga': 2.5,
  'valentino': 3.0,
  'goyard': 6.0,
};

// Iconic models with extra premiums
const ICONIC_MODELS: Record<string, number> = {
  // Watches
  'submariner': 1.5,
  'daytona': 2.5,
  'nautilus': 3.0,
  'royal oak': 2.5,
  'speedmaster': 1.3,
  'santos': 1.4,
  'tank': 1.3,
  'datejust': 1.2,
  'aquanaut': 2.0,
  'calatrava': 1.5,
  
  // Cars
  '911': 1.5,
  'f40': 3.0,
  'f50': 3.5,
  'enzo': 4.0,
  'laferrari': 5.0,
  'aventador': 1.8,
  'huracan': 1.5,
  'countach': 2.5,
  'miura': 3.0,
  'veyron': 2.5,
  'chiron': 3.0,
  
  // Handbags
  'birkin': 3.0,
  'kelly': 2.5,
  'classic flap': 1.8,
  '2.55': 1.8,
  'boy bag': 1.4,
  'neverfull': 1.2,
  'speedy': 1.3,
  'lady dior': 1.5,
  'saddle bag': 1.4,
};

/**
 * Calculate age factor (appreciation or depreciation)
 */
function calculateAgeFactor(
  year: number | undefined,
  categorySlug: string
): number {
  if (!year) return 1.0;

  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  // Vintage watches (20+ years) and classic cars (25+ years) can appreciate
  if (categorySlug === 'watches' && age >= 20) {
    return 1.0 + (age - 20) * 0.02; // 2% per year after 20 years
  }
  
  if (categorySlug === 'luxury_cars' && age >= 25) {
    return 1.0 + (age - 25) * 0.03; // 3% per year for classic cars
  }

  // Modern depreciation
  if (categorySlug === 'luxury_cars' && age <= 10) {
    return Math.max(0.4, 1.0 - age * 0.06); // 6% per year, floor at 40%
  }

  if (categorySlug === 'handbags' && age <= 5) {
    return Math.max(0.7, 1.0 - age * 0.06); // 6% per year, floor at 70%
  }

  // Default: mild depreciation
  return Math.max(0.8, 1.0 - age * 0.02); // 2% per year, floor at 80%
}

/**
 * Calculate condition multiplier
 */
function calculateConditionFactor(
  status: 'draft' | 'pending' | 'verified' | 'flagged'
): number {
  // In real implementation, this would be based on detailed condition assessment
  // For now, we use status as a proxy
  switch (status) {
    case 'verified':
      return 1.0; // Excellent condition
    case 'pending':
      return 0.9; // Good condition  
    case 'draft':
      return 0.85; // Fair condition
    case 'flagged':
      return 0.7; // Poor condition or issues
    default:
      return 0.9;
  }
}

/**
 * Estimate market value for an asset
 */
export async function estimateMarketValue(params: {
  categorySlug: string;
  brand?: string;
  model?: string;
  year?: number;
  status?: 'draft' | 'pending' | 'verified' | 'flagged';
  serialNumber?: string;
  referenceNumber?: string;
}): Promise<ValueEstimate> {
  const {
    categorySlug,
    brand,
    model,
    year,
    status = 'pending',
    serialNumber,
    referenceNumber,
  } = params;

  // Base value for category
  let baseValue = BASE_VALUES[categorySlug] || 1000;
  let confidence: 'low' | 'medium' | 'high' = 'low';
  let source: 'database' | 'market_data' | 'heuristic' = 'heuristic';

  // Brand factor
  let brandFactor = 1.0;
  if (brand) {
    const normalizedBrand = brand.toLowerCase().trim();
    
    if (categorySlug === 'watches') {
      brandFactor = WATCH_BRAND_MULTIPLIERS[normalizedBrand] || 1.0;
    } else if (categorySlug === 'luxury_cars') {
      brandFactor = CAR_BRAND_MULTIPLIERS[normalizedBrand] || 1.0;
    } else if (categorySlug === 'handbags') {
      brandFactor = HANDBAG_BRAND_MULTIPLIERS[normalizedBrand] || 1.0;
    }

    if (brandFactor > 1.0) {
      confidence = 'medium';
    }
  }

  // Model factor (iconic models)
  let modelFactor = 1.0;
  if (model) {
    const normalizedModel = model.toLowerCase().trim();
    for (const [iconicModel, premium] of Object.entries(ICONIC_MODELS)) {
      if (normalizedModel.includes(iconicModel)) {
        modelFactor = premium;
        confidence = 'high';
        break;
      }
    }
  }

  // Age factor
  const ageFactor = calculateAgeFactor(year, categorySlug);

  // Condition factor
  const conditionFactor = calculateConditionFactor(status);

  // Rarity factor (based on serial/reference numbers)
  let rarityFactor = 1.0;
  if (serialNumber || referenceNumber) {
    rarityFactor = 1.1; // 10% premium for numbered items
  }

  // Calculate estimated value
  const estimatedValue = Math.round(
    baseValue * brandFactor * modelFactor * ageFactor * conditionFactor * rarityFactor
  );

  // Calculate range (±20% for medium confidence, ±40% for low)
  const rangePercent = confidence === 'high' ? 0.15 : confidence === 'medium' ? 0.20 : 0.40;
  const minValue = Math.round(estimatedValue * (1 - rangePercent));
  const maxValue = Math.round(estimatedValue * (1 + rangePercent));

  return {
    estimatedValue,
    confidence,
    minValue,
    maxValue,
    source,
    factors: {
      brand: brandFactor,
      age: ageFactor,
      condition: conditionFactor,
      rarity: rarityFactor,
    },
    marketInsights: {
      trend: ageFactor > 1.0 ? 'increasing' : 'stable',
      demandLevel: brandFactor >= 10 ? 'high' : brandFactor >= 5 ? 'medium' : 'low',
      comparables: 0, // Would be populated from database query
    },
  };
}

/**
 * Format value estimate for display
 */
export function formatValueEstimate(estimate: ValueEstimate): string {
  const { estimatedValue, minValue, maxValue, confidence } = estimate;
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  if (confidence === 'low') {
    return `${formatter.format(minValue)} - ${formatter.format(maxValue)}`;
  }

  return formatter.format(estimatedValue);
}

/**
 * Get confidence description
 */
export function getConfidenceDescription(confidence: 'low' | 'medium' | 'high'): string {
  switch (confidence) {
    case 'high':
      return 'High confidence - Based on well-known brand and model';
    case 'medium':
      return 'Medium confidence - Based on brand recognition';
    case 'low':
      return 'Low confidence - Rough estimate based on category';
  }
}
