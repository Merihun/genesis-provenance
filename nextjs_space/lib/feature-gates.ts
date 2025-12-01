/**
 * Feature Gating & Usage Tracking
 * Enforces subscription limits and tracks feature usage
 */

import { prisma } from './db';
import { SubscriptionPlan } from '@prisma/client';
import { getLimit, isWithinLimit, getPlanConfig, PLAN_CONFIG } from './stripe';

export type FeatureType =
  | 'asset_created'
  | 'ai_analysis'
  | 'vin_lookup'
  | 'team_member_added'
  | 'pdf_certificate'
  | 'storage_used';

export interface FeatureAccessResult {
  allowed: boolean;
  limit: number;
  current: number;
  remaining?: number;
  plan: SubscriptionPlan;
  upgradeRequired?: boolean;
}

/**
 * Check if an organization has access to create a new asset
 */
export async function checkFeatureAccess(
  organizationId: string,
  feature: FeatureType
): Promise<FeatureAccessResult> {
  // Get organization's subscription
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  // Default to collector plan if no subscription (trial/free tier)
  const plan: SubscriptionPlan = subscription?.plan || 'collector';
  const planConfig = getPlanConfig(plan);

  // Map feature types to limit keys
  const featureLimitMap: Record<FeatureType, keyof typeof PLAN_CONFIG.collector.limits> = {
    asset_created: 'assets',
    ai_analysis: 'aiAnalysesPerMonth',
    vin_lookup: 'vinLookupsPerMonth',
    team_member_added: 'teamMembers',
    pdf_certificate: 'assets', // Same as assets limit
    storage_used: 'storageGB',
  };

  const limitKey = featureLimitMap[feature];
  const limit = planConfig.limits[limitKey];

  // Get current usage based on feature type
  let currentUsage = 0;

  if (feature === 'asset_created' || feature === 'pdf_certificate') {
    // Count total assets for the organization
    currentUsage = await prisma.item.count({
      where: { organizationId },
    });
  } else if (feature === 'team_member_added') {
    // Count team members
    currentUsage = await prisma.teamMember.count({
      where: { organizationId },
    });
  } else if (
    feature === 'ai_analysis' ||
    feature === 'vin_lookup' ||
    feature === 'storage_used'
  ) {
    // Get current billing period
    const periodStart = subscription?.currentPeriodStart || new Date();
    const periodEnd = subscription?.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Sum usage logs for this feature in current period
    const usageLogs = await prisma.usageLog.findMany({
      where: {
        organizationId,
        feature,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    currentUsage = usageLogs.reduce((sum, log) => sum + log.count, 0);
  }

  // Check if within limit
  const allowed = isWithinLimit(currentUsage, limit);
  const remaining = limit === -1 ? -1 : Math.max(0, limit - currentUsage);

  return {
    allowed,
    limit,
    current: currentUsage,
    remaining,
    plan,
    upgradeRequired: !allowed && plan !== 'enterprise',
  };
}

/**
 * Track feature usage (creates a usage log entry)
 */
export async function trackFeatureUsage(params: {
  organizationId: string;
  feature: FeatureType;
  count?: number;
  metadata?: Record<string, any>;
}): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: params.organizationId },
  });

  const periodStart = subscription?.currentPeriodStart || new Date();
  const periodEnd = subscription?.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.usageLog.create({
    data: {
      organizationId: params.organizationId,
      subscriptionId: subscription?.id,
      feature: params.feature,
      count: params.count || 1,
      metadata: params.metadata || {},
      periodStart,
      periodEnd,
    },
  });
}

/**
 * Get usage summary for an organization
 */
export async function getUsageSummary(organizationId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  const plan: SubscriptionPlan = subscription?.plan || 'collector';
  const planConfig = getPlanConfig(plan);

  const periodStart = subscription?.currentPeriodStart || new Date();
  const periodEnd = subscription?.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Get total assets
  const totalAssets = await prisma.item.count({
    where: { organizationId },
  });

  // Get team members count
  const teamMembersCount = await prisma.teamMember.count({
    where: { organizationId },
  });

  // Get usage logs for current period
  const usageLogs = await prisma.usageLog.findMany({
    where: {
      organizationId,
      createdAt: {
        gte: periodStart,
        lte: periodEnd,
      },
    },
  });

  // Aggregate usage by feature
  const usageByFeature = usageLogs.reduce(
    (acc: any, log: any) => {
      if (!acc[log.feature]) {
        acc[log.feature] = 0;
      }
      acc[log.feature] += log.count;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    plan,
    limits: planConfig.limits,
    usage: {
      assets: totalAssets,
      teamMembers: teamMembersCount,
      aiAnalyses: usageByFeature['ai_analysis'] || 0,
      vinLookups: usageByFeature['vin_lookup'] || 0,
      pdfCertificates: usageByFeature['pdf_certificate'] || 0,
    },
    periodStart,
    periodEnd,
  };
}

/**
 * Calculate storage usage in GB for an organization
 */
export async function calculateStorageUsage(organizationId: string): Promise<number> {
  const mediaAssets = await prisma.mediaAsset.findMany({
    where: {
      item: {
        organizationId,
      },
    },
    select: {
      fileSize: true,
    },
  });

  const totalBytes = mediaAssets.reduce((sum, asset) => sum + asset.fileSize, 0);
  const totalGB = totalBytes / (1024 * 1024 * 1024);

  return Math.round(totalGB * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if advanced analytics is available for a plan
 */
export function hasAdvancedAnalytics(plan: SubscriptionPlan): boolean {
  return PLAN_CONFIG[plan].features.advancedAnalytics;
}

/**
 * Check if priority support is available for a plan
 */
export function hasPrioritySupport(plan: SubscriptionPlan): boolean {
  return PLAN_CONFIG[plan].features.prioritySupport;
}

/**
 * Check if API access is available for a plan
 */
export function hasApiAccess(plan: SubscriptionPlan): boolean {
  return PLAN_CONFIG[plan].features.apiAccess;
}
