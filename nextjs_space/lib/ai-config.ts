/**
 * AI Provider Configuration and Feature Flags
 * Supports gradual rollout, A/B testing, and organization-specific overrides
 */

export type AIProvider = 'mock' | 'google-vision' | 'aws-rekognition';

export interface AIProviderConfig {
  provider: AIProvider;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  useForAnalysis: boolean;
}

export interface AIAnalysisConfig {
  primaryProvider: AIProvider;
  fallbackProvider: AIProvider;
  enableDualMode: boolean; // Run both providers and compare
  logComparisons: boolean;
}

/**
 * Get AI provider configuration from environment variables
 */
export function getAIProviderConfig(): AIProviderConfig {
  const googleVisionEnabled = process.env.GOOGLE_VISION_ENABLED === 'true';
  const rolloutPercentage = parseInt(process.env.GOOGLE_VISION_ROLLOUT_PERCENTAGE || '100', 10);
  
  return {
    provider: googleVisionEnabled ? 'google-vision' : 'mock',
    enabled: googleVisionEnabled,
    rolloutPercentage: Math.min(Math.max(rolloutPercentage, 0), 100),
    useForAnalysis: googleVisionEnabled,
  };
}

/**
 * Get comprehensive AI analysis configuration
 */
export function getAIAnalysisConfig(): AIAnalysisConfig {
  const config = getAIProviderConfig();
  const dualModeEnabled = process.env.AI_DUAL_MODE_ENABLED === 'true';
  const logComparisons = process.env.AI_LOG_COMPARISONS === 'true';
  
  return {
    primaryProvider: config.enabled ? 'google-vision' : 'mock',
    fallbackProvider: 'mock',
    enableDualMode: dualModeEnabled,
    logComparisons: logComparisons || dualModeEnabled, // Auto-enable logging if dual mode is on
  };
}

/**
 * Determine which AI provider to use for a specific organization
 * Supports percentage-based gradual rollout and organization-specific overrides
 */
export function selectAIProvider(organizationId: string): AIProvider {
  const config = getAIProviderConfig();
  
  // Check for organization-specific override
  const overrides = process.env.AI_PROVIDER_OVERRIDES || '';
  if (overrides) {
    const overrideMap = parseOverrides(overrides);
    if (overrideMap[organizationId]) {
      console.log(`[AI Config] Using override for org ${organizationId}: ${overrideMap[organizationId]}`);
      return overrideMap[organizationId] as AIProvider;
    }
  }
  
  // If Google Vision is disabled, use mock
  if (!config.enabled) {
    return 'mock';
  }
  
  // If rollout percentage is 100%, use Google Vision for everyone
  if (config.rolloutPercentage === 100) {
    return 'google-vision';
  }
  
  // If rollout percentage is 0%, use mock for everyone
  if (config.rolloutPercentage === 0) {
    return 'mock';
  }
  
  // Use deterministic hash-based selection for gradual rollout
  // This ensures the same organization always gets the same provider
  const hash = simpleHash(organizationId);
  const percentage = hash % 100;
  
  if (percentage < config.rolloutPercentage) {
    console.log(`[AI Config] Org ${organizationId} selected for Google Vision (${percentage}% < ${config.rolloutPercentage}%)`);
    return 'google-vision';
  } else {
    console.log(`[AI Config] Org ${organizationId} using mock AI (${percentage}% >= ${config.rolloutPercentage}%)`);
    return 'mock';
  }
}

/**
 * Parse override string into a map
 * Format: "orgId1:google-vision,orgId2:mock,orgId3:aws-rekognition"
 */
function parseOverrides(overrides: string): Record<string, string> {
  const map: Record<string, string> = {};
  
  const pairs = overrides.split(',').map(s => s.trim()).filter(Boolean);
  for (const pair of pairs) {
    const [orgId, provider] = pair.split(':').map(s => s.trim());
    if (orgId && provider) {
      map[orgId] = provider;
    }
  }
  
  return map;
}

/**
 * Simple deterministic hash function for organization IDs
 * Ensures consistent provider selection for gradual rollout
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Check if dual-mode analysis is enabled
 * In dual mode, both providers run in parallel for comparison
 */
export function isDualModeEnabled(): boolean {
  return process.env.AI_DUAL_MODE_ENABLED === 'true';
}

/**
 * Check if comparison logging is enabled
 */
export function shouldLogComparisons(): boolean {
  const config = getAIAnalysisConfig();
  return config.logComparisons;
}

/**
 * Log comparison between two AI analysis results
 */
export function logAIComparison(
  itemId: string,
  organizationId: string,
  googleVisionResult: any,
  mockResult: any
): void {
  if (!shouldLogComparisons()) {
    return;
  }
  
  console.log('='.repeat(80));
  console.log(`[AI Comparison] Item ${itemId} | Org ${organizationId}`);
  console.log('-'.repeat(80));
  
  console.log('Google Vision AI Results:');
  console.log(`  Confidence: ${googleVisionResult.confidenceScore}%`);
  console.log(`  Fraud Risk: ${googleVisionResult.fraudRiskLevel}`);
  console.log(`  Processing Time: ${googleVisionResult.processingTime}ms`);
  console.log(`  Authenticity Markers: ${googleVisionResult.authenticityMarkers.length}`);
  console.log(`  Counterfeit Indicators: ${googleVisionResult.counterfeitIndicators.length}`);
  
  console.log('-'.repeat(80));
  console.log('Mock AI Results:');
  console.log(`  Confidence: ${mockResult.confidenceScore}%`);
  console.log(`  Fraud Risk: ${mockResult.fraudRiskLevel}`);
  console.log(`  Processing Time: ${mockResult.processingTime}ms`);
  console.log(`  Authenticity Markers: ${mockResult.authenticityMarkers.length}`);
  console.log(`  Counterfeit Indicators: ${mockResult.counterfeitIndicators.length}`);
  
  console.log('-'.repeat(80));
  console.log('Comparison:');
  console.log(`  Confidence Difference: ${Math.abs(googleVisionResult.confidenceScore - mockResult.confidenceScore).toFixed(1)}%`);
  console.log(`  Risk Level Match: ${googleVisionResult.fraudRiskLevel === mockResult.fraudRiskLevel ? 'YES' : 'NO'}`);
  console.log(`  Google Vision Faster: ${googleVisionResult.processingTime < mockResult.processingTime ? 'YES' : 'NO'}`);
  
  console.log('='.repeat(80));
}

/**
 * Get a human-readable name for an AI provider
 */
export function getProviderName(provider: AIProvider): string {
  const names: Record<AIProvider, string> = {
    mock: 'Mock AI',
    'google-vision': 'Google Cloud Vision AI',
    'aws-rekognition': 'AWS Rekognition',
  };
  return names[provider] || provider;
}

/**
 * Get status message for the current AI configuration
 */
export function getAIConfigStatus(): string {
  const config = getAIProviderConfig();
  const analysisConfig = getAIAnalysisConfig();
  
  let status = `Primary Provider: ${getProviderName(analysisConfig.primaryProvider)}`;
  
  if (config.enabled && config.rolloutPercentage < 100) {
    status += ` (${config.rolloutPercentage}% rollout)`;
  }
  
  if (analysisConfig.enableDualMode) {
    status += ' | Dual-Mode: ENABLED (comparing both providers)';
  }
  
  return status;
}
