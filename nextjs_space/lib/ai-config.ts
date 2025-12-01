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
 * Now supports both Google Vision AI and AWS Rekognition
 */
export function getAIProviderConfig(): AIProviderConfig {
  const googleVisionEnabled = process.env.GOOGLE_VISION_ENABLED === 'true';
  const awsRekognitionEnabled = process.env.AWS_REKOGNITION_ENABLED === 'true';
  const rolloutPercentage = parseInt(process.env.GOOGLE_VISION_ROLLOUT_PERCENTAGE || '100', 10);
  
  // Determine primary provider
  let provider: AIProvider = 'mock';
  if (awsRekognitionEnabled) {
    provider = 'aws-rekognition';
  } else if (googleVisionEnabled) {
    provider = 'google-vision';
  }
  
  return {
    provider,
    enabled: googleVisionEnabled || awsRekognitionEnabled,
    rolloutPercentage: Math.min(Math.max(rolloutPercentage, 0), 100),
    useForAnalysis: googleVisionEnabled || awsRekognitionEnabled,
  };
}

/**
 * Get comprehensive AI analysis configuration
 * Supports multi-provider strategy
 */
export function getAIAnalysisConfig(): AIAnalysisConfig {
  const config = getAIProviderConfig();
  const dualModeEnabled = process.env.AI_DUAL_MODE_ENABLED === 'true';
  const logComparisons = process.env.AI_LOG_COMPARISONS === 'true';
  
  return {
    primaryProvider: config.provider,
    fallbackProvider: 'mock',
    enableDualMode: dualModeEnabled,
    logComparisons: logComparisons || dualModeEnabled, // Auto-enable logging if dual mode is on
  };
}

/**
 * Determine which AI provider to use for a specific organization
 * Supports percentage-based gradual rollout and organization-specific overrides
 * Now includes AWS Rekognition as an alternative provider
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
  
  // If no AI providers are enabled, use mock
  if (!config.enabled) {
    return 'mock';
  }
  
  // If rollout percentage is 100%, use the configured primary provider
  if (config.rolloutPercentage === 100) {
    console.log(`[AI Config] Using primary provider for org ${organizationId}: ${config.provider}`);
    return config.provider;
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
    console.log(`[AI Config] Org ${organizationId} selected for ${config.provider} (${percentage}% < ${config.rolloutPercentage}%)`);
    return config.provider;
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
 * Now supports comparison between any two providers
 */
export function logAIComparison(
  itemId: string,
  organizationId: string,
  provider1Result: any,
  provider2Result: any,
  provider1Name: string = 'Provider 1',
  provider2Name: string = 'Provider 2'
): void {
  if (!shouldLogComparisons()) {
    return;
  }
  
  console.log('='.repeat(80));
  console.log(`[AI Comparison] Item ${itemId} | Org ${organizationId}`);
  console.log('-'.repeat(80));
  
  console.log(`${provider1Name} Results:`);
  console.log(`  Confidence: ${provider1Result.confidenceScore}%`);
  console.log(`  Fraud Risk: ${provider1Result.fraudRiskLevel}`);
  console.log(`  Processing Time: ${provider1Result.processingTime}ms`);
  console.log(`  Authenticity Markers: ${provider1Result.authenticityMarkers.length}`);
  console.log(`  Counterfeit Indicators: ${provider1Result.counterfeitIndicators.length}`);
  
  console.log('-'.repeat(80));
  console.log(`${provider2Name} Results:`);
  console.log(`  Confidence: ${provider2Result.confidenceScore}%`);
  console.log(`  Fraud Risk: ${provider2Result.fraudRiskLevel}`);
  console.log(`  Processing Time: ${provider2Result.processingTime}ms`);
  console.log(`  Authenticity Markers: ${provider2Result.authenticityMarkers.length}`);
  console.log(`  Counterfeit Indicators: ${provider2Result.counterfeitIndicators.length}`);
  
  console.log('-'.repeat(80));
  console.log('Comparison:');
  console.log(`  Confidence Difference: ${Math.abs(provider1Result.confidenceScore - provider2Result.confidenceScore).toFixed(1)}%`);
  console.log(`  Risk Level Match: ${provider1Result.fraudRiskLevel === provider2Result.fraudRiskLevel ? 'YES' : 'NO'}`);
  console.log(`  ${provider1Name} Faster: ${provider1Result.processingTime < provider2Result.processingTime ? 'YES' : 'NO'}`);
  
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
