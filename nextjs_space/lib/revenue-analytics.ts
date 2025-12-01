/**
 * Revenue Analytics Utility
 * 
 * Provides comprehensive revenue analysis, MRR/ARR calculations,
 * churn analysis, and cohort tracking for subscription monetization.
 */

import { prisma } from './db';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PLAN_CONFIG } from './stripe';

// ============================================================================
// TYPES
// ============================================================================

export interface RevenueMetrics {
  // Monthly Recurring Revenue
  mrr: number;
  // Annual Recurring Revenue (MRR * 12)
  arr: number;
  // Total active subscriptions
  activeSubscriptions: number;
  // New subscriptions this month
  newSubscriptionsThisMonth: number;
  // Churned subscriptions this month
  churnedSubscriptionsThisMonth: number;
  // Churn rate (percentage)
  churnRate: number;
  // Average revenue per user
  arpu: number;
  // Breakdown by plan
  byPlan: {
    plan: SubscriptionPlan;
    count: number;
    mrr: number;
    percentage: number;
  }[];
  // Growth metrics
  growth: {
    mrrGrowth: number; // percentage
    subscriptionGrowth: number; // percentage
  };
}

export interface UsageTrend {
  feature: string;
  totalUsage: number;
  averagePerOrg: number;
  topUsers: {
    organizationId: string;
    organizationName: string;
    usage: number;
    plan: SubscriptionPlan;
    approachingLimit: boolean;
  }[];
}

export interface CohortAnalysis {
  cohortMonth: string; // YYYY-MM
  totalSubscriptions: number;
  retained: number;
  churned: number;
  retentionRate: number;
  revenue: number;
}

export interface UpgradeOpportunity {
  organizationId: string;
  organizationName: string;
  currentPlan: SubscriptionPlan;
  suggestedPlan: SubscriptionPlan;
  reason: string;
  usagePercentage: number;
  potentialMRRIncrease: number;
}

// ============================================================================
// REVENUE CALCULATIONS
// ============================================================================

/**
 * Calculate Monthly Recurring Revenue (MRR)
 * Normalizes all subscriptions to monthly values
 */
export async function calculateMRR(): Promise<number> {
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'active',
    },
    include: {
      organization: true,
    },
  });

  let totalMRR = 0;

  for (const sub of activeSubscriptions) {
    const planConfig = PLAN_CONFIG[sub.plan];
    if (!planConfig) continue;

    // Check if annual or monthly based on stripePriceId
    const isAnnual = sub.stripePriceId?.includes('annual') || false;
    
    if (isAnnual) {
      // Normalize annual to monthly
      totalMRR += planConfig.pricing.annual.amount / 12;
    } else {
      totalMRR += planConfig.pricing.monthly.amount;
    }
  }

  return Math.round(totalMRR * 100) / 100;
}

/**
 * Calculate Annual Recurring Revenue (ARR)
 */
export async function calculateARR(): Promise<number> {
  const mrr = await calculateMRR();
  return Math.round(mrr * 12 * 100) / 100;
}

/**
 * Calculate Average Revenue Per User (ARPU)
 */
export async function calculateARPU(): Promise<number> {
  const mrr = await calculateMRR();
  const activeCount = await prisma.subscription.count({
    where: { status: 'active' },
  });

  if (activeCount === 0) return 0;
  return Math.round((mrr / activeCount) * 100) / 100;
}

// ============================================================================
// CHURN ANALYSIS
// ============================================================================

/**
 * Calculate churn rate for the current month
 * Churn Rate = (Churned Customers / Total Customers at Start of Period) * 100
 */
export async function calculateChurnRate(): Promise<{
  churnRate: number;
  churnedCount: number;
  totalAtStart: number;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Total active subscriptions at start of month
  const totalAtStart = await prisma.subscription.count({
    where: {
      createdAt: { lt: startOfMonth },
      OR: [
        { status: 'active' },
        { 
          status: 'cancelled',
          canceledAt: { gte: startOfMonth },
        },
      ],
    },
  });

  // Subscriptions that churned this month
  const churnedCount = await prisma.subscription.count({
    where: {
      status: 'cancelled',
      canceledAt: {
        gte: startOfMonth,
        lt: now,
      },
    },
  });

  const churnRate = totalAtStart > 0 
    ? Math.round((churnedCount / totalAtStart) * 10000) / 100 
    : 0;

  return { churnRate, churnedCount, totalAtStart };
}

// ============================================================================
// COMPREHENSIVE REVENUE METRICS
// ============================================================================

/**
 * Get comprehensive revenue metrics dashboard
 */
export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Current MRR and ARR
  const mrr = await calculateMRR();
  const arr = await calculateARR();
  const arpu = await calculateARPU();

  // Active subscriptions
  const activeSubscriptions = await prisma.subscription.count({
    where: { status: 'active' },
  });

  // New subscriptions this month
  const newSubscriptionsThisMonth = await prisma.subscription.count({
    where: {
      status: 'active',
      createdAt: { gte: startOfMonth },
    },
  });

  // Churn data
  const { churnRate, churnedCount } = await calculateChurnRate();

  // Breakdown by plan
  const subscriptionsByPlan = await prisma.subscription.groupBy({
    by: ['plan'],
    where: { status: 'active' },
    _count: { plan: true },
  });

  const byPlan = subscriptionsByPlan.map((group) => {
    const planConfig = PLAN_CONFIG[group.plan];
    const count = group._count.plan;
    // Assume 50/50 split between monthly/annual for MRR calculation
    const avgMRR = (planConfig.pricing.monthly.amount + planConfig.pricing.annual.amount / 12) / 2;
    const planMRR = count * avgMRR;

    return {
      plan: group.plan,
      count,
      mrr: Math.round(planMRR * 100) / 100,
      percentage: Math.round((planMRR / mrr) * 10000) / 100,
    };
  });

  // Growth calculations (compare to last month)
  const lastMonthMRR = await calculateHistoricalMRR(startOfLastMonth);
  const lastMonthSubCount = await prisma.subscription.count({
    where: {
      createdAt: { lt: startOfMonth },
      OR: [
        { status: 'active' },
        { status: 'cancelled', canceledAt: { gte: startOfMonth } },
      ],
    },
  });

  const mrrGrowth = lastMonthMRR > 0 
    ? Math.round(((mrr - lastMonthMRR) / lastMonthMRR) * 10000) / 100 
    : 0;
  const subscriptionGrowth = lastMonthSubCount > 0
    ? Math.round(((activeSubscriptions - lastMonthSubCount) / lastMonthSubCount) * 10000) / 100
    : 0;

  return {
    mrr,
    arr,
    activeSubscriptions,
    newSubscriptionsThisMonth,
    churnedSubscriptionsThisMonth: churnedCount,
    churnRate,
    arpu,
    byPlan,
    growth: {
      mrrGrowth,
      subscriptionGrowth,
    },
  };
}

/**
 * Calculate historical MRR for a specific date
 */
async function calculateHistoricalMRR(date: Date): Promise<number> {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      createdAt: { lt: date },
      OR: [
        { status: 'active' },
        { 
          status: 'cancelled',
          canceledAt: { gte: date },
        },
      ],
    },
  });

  let totalMRR = 0;

  for (const sub of subscriptions) {
    const planConfig = PLAN_CONFIG[sub.plan];
    if (!planConfig) continue;

    const isAnnual = sub.stripePriceId?.includes('annual') || false;
    
    if (isAnnual) {
      totalMRR += planConfig.pricing.annual.amount / 12;
    } else {
      totalMRR += planConfig.pricing.monthly.amount;
    }
  }

  return Math.round(totalMRR * 100) / 100;
}

// ============================================================================
// USAGE TRENDS & ANALYTICS
// ============================================================================

/**
 * Get usage trends across all organizations
 */
export async function getUsageTrends(): Promise<UsageTrend[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get usage logs for the past 30 days
  const usageLogs = await prisma.usageLog.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    include: {
      organization: {
        include: {
          subscriptions: true,
        },
      },
    },
  });

  // Group by feature
  const featureMap = new Map<string, {
    totalUsage: number;
    orgUsage: Map<string, { count: number; name: string; plan: SubscriptionPlan }>;
  }>();

  for (const log of usageLogs) {
    if (!featureMap.has(log.feature)) {
      featureMap.set(log.feature, {
        totalUsage: 0,
        orgUsage: new Map(),
      });
    }

    const featureData = featureMap.get(log.feature)!;
    featureData.totalUsage += log.count;

    if (!featureData.orgUsage.has(log.organizationId)) {
      const orgSubscription = log.organization.subscriptions?.[0];
      featureData.orgUsage.set(log.organizationId, {
        count: 0,
        name: log.organization.name,
        plan: orgSubscription?.plan || 'collector',
      });
    }

    const orgData = featureData.orgUsage.get(log.organizationId)!;
    orgData.count += log.count;
  }

  // Convert to array and calculate top users
  const trends: UsageTrend[] = [];

  for (const [feature, data] of featureMap.entries()) {
    const orgCount = data.orgUsage.size;
    const averagePerOrg = orgCount > 0 ? Math.round(data.totalUsage / orgCount) : 0;

    // Get top 5 users
    const topUsers = Array.from(data.orgUsage.entries())
      .map(([orgId, orgData]) => {
        const planConfig = PLAN_CONFIG[orgData.plan];
        const limit = planConfig?.limits[feature as keyof typeof planConfig.limits] || 0;
        const approachingLimit = limit > 0 && orgData.count >= limit * 0.8;

        return {
          organizationId: orgId,
          organizationName: orgData.name,
          usage: orgData.count,
          plan: orgData.plan,
          approachingLimit,
        };
      })
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);

    trends.push({
      feature,
      totalUsage: data.totalUsage,
      averagePerOrg,
      topUsers,
    });
  }

  return trends.sort((a, b) => b.totalUsage - a.totalUsage);
}

// ============================================================================
// UPGRADE OPPORTUNITIES
// ============================================================================

/**
 * Identify organizations that should upgrade based on usage patterns
 */
export async function getUpgradeOpportunities(): Promise<UpgradeOpportunity[]> {
  const organizations = await prisma.organization.findMany({
    include: {
      subscriptions: true,
    },
  });

  const opportunities: UpgradeOpportunity[] = [];

  for (const org of organizations) {
    const subscription = org.subscriptions?.[0];
    if (!subscription || subscription.plan === 'enterprise') {
      continue; // Skip orgs without subscriptions or already on top plan
    }

    const currentPlan = subscription.plan;
    const planConfig = PLAN_CONFIG[currentPlan];

    // Check usage for key features
    const now = new Date();
    const periodStart = subscription.currentPeriodStart || now;
    const periodEnd = subscription.currentPeriodEnd || now;

    const usageLogs = await prisma.usageLog.findMany({
      where: {
        organizationId: org.id,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // Calculate usage percentages for critical features
    const featureUsage: { [key: string]: number } = {};
    for (const log of usageLogs) {
      featureUsage[log.feature] = (featureUsage[log.feature] || 0) + log.count;
    }

    // Find features approaching limits (>= 80%)
    for (const [feature, usage] of Object.entries(featureUsage)) {
      const limit = planConfig.limits[feature as keyof typeof planConfig.limits];
      if (!limit || typeof limit !== 'number') continue;

      const usagePercentage = Math.round((usage / limit) * 100);

      if (usagePercentage >= 80) {
        // Suggest upgrade
        const suggestedPlan: SubscriptionPlan = 
          currentPlan === 'collector' ? 'dealer' : 'enterprise';

        const currentPlanPrice = planConfig.pricing.monthly.amount;
        const suggestedPlanPrice = PLAN_CONFIG[suggestedPlan].pricing.monthly.amount;
        const potentialMRRIncrease = suggestedPlanPrice - currentPlanPrice;

        opportunities.push({
          organizationId: org.id,
          organizationName: org.name,
          currentPlan,
          suggestedPlan,
          reason: `${feature.replace('_', ' ')} at ${usagePercentage}% of limit`,
          usagePercentage,
          potentialMRRIncrease,
        });

        break; // Only suggest one upgrade per organization
      }
    }
  }

  return opportunities.sort((a, b) => b.usagePercentage - a.usagePercentage);
}

// ============================================================================
// COHORT ANALYSIS
// ============================================================================

/**
 * Perform cohort retention analysis
 * Groups subscriptions by signup month and tracks retention
 */
export async function getCohortAnalysis(monthsBack: number = 6): Promise<CohortAnalysis[]> {
  const cohorts: CohortAnalysis[] = [];
  const now = new Date();

  for (let i = 0; i < monthsBack; i++) {
    const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(cohortDate.getFullYear(), cohortDate.getMonth() + 1, 1);
    const cohortMonth = `${cohortDate.getFullYear()}-${String(cohortDate.getMonth() + 1).padStart(2, '0')}`;

    // Subscriptions created in this cohort month
    const totalSubscriptions = await prisma.subscription.count({
      where: {
        createdAt: {
          gte: cohortDate,
          lt: nextMonth,
        },
      },
    });

    if (totalSubscriptions === 0) {
      cohorts.push({
        cohortMonth,
        totalSubscriptions: 0,
        retained: 0,
        churned: 0,
        retentionRate: 0,
        revenue: 0,
      });
      continue;
    }

    // How many are still active
    const retained = await prisma.subscription.count({
      where: {
        createdAt: {
          gte: cohortDate,
          lt: nextMonth,
        },
        status: 'active',
      },
    });

    // How many churned
    const churned = await prisma.subscription.count({
      where: {
        createdAt: {
          gte: cohortDate,
          lt: nextMonth,
        },
        status: 'cancelled',
      },
    });

    const retentionRate = Math.round((retained / totalSubscriptions) * 10000) / 100;

    // Calculate revenue from this cohort
    const cohortSubs = await prisma.subscription.findMany({
      where: {
        createdAt: {
          gte: cohortDate,
          lt: nextMonth,
        },
        status: 'active',
      },
    });

    let revenue = 0;
    for (const sub of cohortSubs) {
      const planConfig = PLAN_CONFIG[sub.plan];
      if (!planConfig) continue;

      const isAnnual = sub.stripePriceId?.includes('annual') || false;
      revenue += isAnnual 
        ? planConfig.pricing.annual.amount / 12 
        : planConfig.pricing.monthly.amount;
    }

    cohorts.push({
      cohortMonth,
      totalSubscriptions,
      retained,
      churned,
      retentionRate,
      revenue: Math.round(revenue * 100) / 100,
    });
  }

  return cohorts.reverse(); // Oldest to newest
}
