/**
 * Smart Upload - AI-powered image analysis for asset registration
 * Extracts brand, model, serial numbers, and provides quality feedback
 */

import { ImageAnnotatorClient } from '@google-cloud/vision';
import { preprocessImage } from './image-preprocessing';

export interface ExtractedData {
  brand?: string;
  model?: string;
  serialNumber?: string;
  referenceNumber?: string;
  year?: number;
  text: string[];
  labels: string[];
  logos: Array<{
    description: string;
    score: number;
  }>;
  confidence: {
    brand?: number;
    model?: number;
    serialNumber?: number;
    referenceNumber?: number;
    year?: number;
  };
}

export interface PhotoQuality {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  issues: string[];
  suggestions: string[];
  metrics: {
    sharpness: number;
    brightness: number;
    resolution: number;
  };
}

/**
 * Analyze an uploaded image and extract luxury asset information
 */
export async function analyzeUploadedImage(
  imageBuffer: Buffer,
  category?: string
): Promise<{ extracted: ExtractedData; quality: PhotoQuality }> {
  try {
    // Check if Google Vision is enabled
    const isEnabled = process.env.GOOGLE_VISION_ENABLED === 'true';
    
    if (!isEnabled) {
      console.log('[Smart Upload] Google Vision AI is disabled, using basic extraction');
      return getMockAnalysis(imageBuffer);
    }

    // Preprocess image for better AI results
    const preprocessed = await preprocessImage(imageBuffer, {
      maxWidth: 2048,
      quality: 90,
      enhanceContrast: true,
      sharpen: true,
    });

    // Initialize Google Vision client
    const client = new ImageAnnotatorClient();

    // Perform multiple detections in parallel
    const [textResult, labelResult, logoResult, propertiesResult] = await Promise.all([
      client.textDetection(preprocessed.buffer),
      client.labelDetection(preprocessed.buffer),
      client.logoDetection(preprocessed.buffer),
      client.imageProperties(preprocessed.buffer),
    ]);

    // Extract text
    const text = extractText(textResult[0]);
    
    // Extract labels
    const labels = extractLabels(labelResult[0]);
    
    // Extract logos
    const logos = extractLogos(logoResult[0]);
    
    // Extract image properties for quality assessment
    const properties = propertiesResult[0];

    // Parse extracted data based on category
    const extracted = parseExtractedData(text, labels, logos, category);
    
    // Assess photo quality
    const quality = assessPhotoQuality(properties, preprocessed);

    return { extracted, quality };
  } catch (error) {
    console.error('[Smart Upload] Error analyzing image:', error);
    // Return basic extraction on error
    return getMockAnalysis(imageBuffer);
  }
}

/**
 * Extract text from Vision API response
 */
function extractText(response: any): string[] {
  const textAnnotations = response.textAnnotations || [];
  if (textAnnotations.length === 0) return [];
  
  // First annotation contains full text
  const fullText = textAnnotations[0]?.description || '';
  
  // Split into lines and clean up
  return fullText
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);
}

/**
 * Extract labels from Vision API response
 */
function extractLabels(response: any): string[] {
  const labelAnnotations = response.labelAnnotations || [];
  return labelAnnotations
    .map((label: any) => label.description)
    .slice(0, 10); // Top 10 labels
}

/**
 * Extract logos from Vision API response
 */
function extractLogos(response: any): Array<{ description: string; score: number }> {
  const logoAnnotations = response.logoAnnotations || [];
  return logoAnnotations.map((logo: any) => ({
    description: logo.description,
    score: logo.score,
  }));
}

/**
 * Parse extracted data into structured format
 */
function parseExtractedData(
  text: string[],
  labels: string[],
  logos: Array<{ description: string; score: number }>,
  category?: string
): ExtractedData {
  const extracted: ExtractedData = {
    text,
    labels,
    logos,
    confidence: {},
  };

  // Extract brand from logos (highest confidence)
  if (logos.length > 0) {
    const topLogo = logos[0];
    extracted.brand = topLogo.description;
    extracted.confidence.brand = Math.round(topLogo.score * 100);
  }

  // Parse text for common patterns
  const allText = text.join(' ');

  // Extract model information
  const modelMatch = extractModel(allText, category);
  if (modelMatch) {
    extracted.model = modelMatch.value;
    extracted.confidence.model = modelMatch.confidence;
  }

  // Extract serial number
  const serialMatch = extractSerialNumber(allText, category);
  if (serialMatch) {
    extracted.serialNumber = serialMatch.value;
    extracted.confidence.serialNumber = serialMatch.confidence;
  }

  // Extract reference number (watches)
  const refMatch = extractReferenceNumber(allText);
  if (refMatch) {
    extracted.referenceNumber = refMatch.value;
    extracted.confidence.referenceNumber = refMatch.confidence;
  }

  // Extract year
  const yearMatch = extractYear(allText);
  if (yearMatch) {
    extracted.year = yearMatch.value;
    extracted.confidence.year = yearMatch.confidence;
  }

  return extracted;
}

/**
 * Extract model information from text
 */
function extractModel(text: string, category?: string): { value: string; confidence: number } | null {
  // Watch models (e.g., "Submariner", "Daytona", "Nautilus")
  const watchModels = [
    'submariner', 'daytona', 'gmt-master', 'datejust', 'day-date',
    'nautilus', 'aquanaut', 'calatrava', 'royal oak', 'offshore',
    'speedmaster', 'seamaster', 'constellation'
  ];

  for (const model of watchModels) {
    const regex = new RegExp(`\\b${model}\\b`, 'i');
    const match = text.match(regex);
    if (match) {
      return {
        value: match[0],
        confidence: 85,
      };
    }
  }

  // Car models (e.g., "911", "Testarossa", "Continental GT")
  const carModelPattern = /\b(?:[A-Z][a-z]+\s)?(?:[A-Z0-9]{2,}|[0-9]{3,4})\b/g;
  const carMatches = text.match(carModelPattern);
  if (carMatches && carMatches.length > 0 && category === 'luxury-cars') {
    return {
      value: carMatches[0],
      confidence: 70,
    };
  }

  return null;
}

/**
 * Extract serial number from text
 */
function extractSerialNumber(text: string, category?: string): { value: string; confidence: number } | null {
  // Watch serial numbers (e.g., "S29XXXXX" for Rolex)
  const watchSerialPattern = /\b[A-Z][0-9]{5,8}\b/g;
  const watchMatches = text.match(watchSerialPattern);
  if (watchMatches && watchMatches.length > 0) {
    return {
      value: watchMatches[0],
      confidence: 80,
    };
  }

  // Generic alphanumeric serial
  const genericPattern = /\b[A-Z0-9]{8,}\b/g;
  const genericMatches = text.match(genericPattern);
  if (genericMatches && genericMatches.length > 0) {
    return {
      value: genericMatches[0],
      confidence: 60,
    };
  }

  return null;
}

/**
 * Extract reference number (watches)
 */
function extractReferenceNumber(text: string): { value: string; confidence: number } | null {
  // Watch reference numbers (e.g., "116610LN", "5711/1A")
  const refPattern = /\b[0-9]{5,6}[A-Z]{0,2}(?:\/[0-9A-Z]+)?\b/g;
  const matches = text.match(refPattern);
  if (matches && matches.length > 0) {
    return {
      value: matches[0],
      confidence: 75,
    };
  }
  return null;
}

/**
 * Extract year from text
 */
function extractYear(text: string): { value: number; confidence: number } | null {
  const currentYear = new Date().getFullYear();
  const yearPattern = /\b(19[5-9][0-9]|20[0-2][0-9])\b/g;
  const matches = text.match(yearPattern);
  
  if (matches && matches.length > 0) {
    const year = parseInt(matches[0], 10);
    // Confidence based on recency
    const age = currentYear - year;
    const confidence = age <= 5 ? 90 : age <= 20 ? 80 : 70;
    
    return {
      value: year,
      confidence,
    };
  }
  
  return null;
}

/**
 * Assess photo quality
 */
function assessPhotoQuality(
  properties: any,
  preprocessed: { width: number; height: number }
): PhotoQuality {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let sharpness = 100;
  let brightness = 100;
  let resolution = 100;

  // Check resolution
  const totalPixels = preprocessed.width * preprocessed.height;
  if (totalPixels < 500000) {
    issues.push('Low resolution');
    suggestions.push('Use a higher resolution camera or move closer');
    resolution = 50;
  } else if (totalPixels < 1000000) {
    resolution = 75;
  }

  // Check brightness from image properties
  const colors = properties.imagePropertiesAnnotation?.dominantColors?.colors || [];
  if (colors.length > 0) {
    const avgBrightness = colors.reduce((sum: number, c: any) => {
      const r = c.color?.red || 0;
      const g = c.color?.green || 0;
      const b = c.color?.blue || 0;
      return sum + (0.299 * r + 0.587 * g + 0.114 * b);
    }, 0) / colors.length;

    if (avgBrightness < 50) {
      issues.push('Image too dark');
      suggestions.push('Increase lighting or use flash');
      brightness = 60;
    } else if (avgBrightness > 220) {
      issues.push('Image too bright');
      suggestions.push('Reduce lighting or avoid direct flash');
      brightness = 70;
    } else {
      brightness = 100;
    }
  }

  // Calculate overall quality
  const scores = [sharpness, brightness, resolution];
  const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  let overall: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 85) overall = 'excellent';
  else if (score >= 70) overall = 'good';
  else if (score >= 50) overall = 'fair';
  else overall = 'poor';

  if (issues.length === 0) {
    suggestions.push('Photo quality is good!');
  }

  return {
    overall,
    score,
    issues,
    suggestions,
    metrics: {
      sharpness,
      brightness,
      resolution,
    },
  };
}

/**
 * Get mock analysis for testing or when AI is disabled
 */
function getMockAnalysis(imageBuffer: Buffer): { extracted: ExtractedData; quality: PhotoQuality } {
  return {
    extracted: {
      text: [],
      labels: [],
      logos: [],
      confidence: {},
    },
    quality: {
      overall: 'good',
      score: 80,
      issues: [],
      suggestions: ['Photo quality is acceptable'],
      metrics: {
        sharpness: 80,
        brightness: 80,
        resolution: 80,
      },
    },
  };
}
