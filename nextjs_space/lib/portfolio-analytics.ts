import prisma from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

export interface PortfolioTrendData {
  date: string;
  totalValue: number;
  totalItems: number;
  verifiedItems: number;
  pendingItems: number;
  growth: number; // percentage
}

export interface CategoryTrend {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  values: {
    date: string;
    value: number;
    itemCount: number;
  }[];
}

export interface PortfolioInsights {
  currentValue: number;
  previousValue: number;
  growthRate: number; // percentage
  growthAmount: number;
  highestValue: number;
  lowestValue: number;
  averageValue: number;
  volatility: number; // standard deviation percentage
}

/**
 * Create a new portfolio snapshot for an organization
 */
export async function createPortfolioSnapshot(organizationId: string) {
  // Get all items for the organization
  const items = await prisma.item.findMany({
    where: { organizationId },
    include: { category: true },
  });

  // Calculate totals
  const totalValue = items.reduce(
    (sum: any, item: any) => sum.add(item.estimatedValue || new Decimal(0)),
    new Decimal(0)
  );
  const totalItems = items.length;
  const verifiedItems = items.filter((item: any) => item.status === 'verified').length;
  const pendingItems = items.filter((item: any) => item.status === 'pending').length;

  // Calculate category breakdown
  const categoryBreakdown: Record<string, any> = {};
  items.forEach((item: any) => {
    const catId = item.categoryId;
    if (!categoryBreakdown[catId]) {
      categoryBreakdown[catId] = {
        categoryId: catId,
        categoryName: item.category.name,
        categorySlug: item.category.slug,
        totalValue: new Decimal(0),
        itemCount: 0,
      };
    }
    categoryBreakdown[catId].totalValue = categoryBreakdown[catId].totalValue.add(
      item.estimatedValue || new Decimal(0)
    );
    categoryBreakdown[catId].itemCount += 1;
  });

  // Convert Decimal to number for JSON storage
  const categoryBreakdownForJson = Object.values(categoryBreakdown).map((cat: any) => ({
    ...cat,
    totalValue: parseFloat(cat.totalValue.toString()),
  }));

  // Calculate status breakdown
  const statusBreakdown = [
    {
      status: 'verified',
      itemCount: verifiedItems,
      totalValue: parseFloat(
        items
          .filter((item: any) => item.status === 'verified')
          .reduce(
            (sum: any, item: any) => sum.add(item.estimatedValue || new Decimal(0)),
            new Decimal(0)
          )
          .toString()
      ),
    },
    {
      status: 'pending',
      itemCount: pendingItems,
      totalValue: parseFloat(
        items
          .filter((item: any) => item.status === 'pending')
          .reduce(
            (sum: any, item: any) => sum.add(item.estimatedValue || new Decimal(0)),
            new Decimal(0)
          )
          .toString()
      ),
    },
    {
      status: 'flagged',
      itemCount: items.filter((item: any) => item.status === 'flagged').length,
      totalValue: parseFloat(
        items
          .filter((item: any) => item.status === 'flagged')
          .reduce(
            (sum: any, item: any) => sum.add(item.estimatedValue || new Decimal(0)),
            new Decimal(0)
          )
          .toString()
      ),
    },
  ];

  // Create snapshot
  const snapshot = await prisma.portfolioSnapshot.create({
    data: {
      organizationId,
      totalValue,
      totalItems,
      verifiedItems,
      pendingItems,
      categoryBreakdown: categoryBreakdownForJson,
      statusBreakdown,
      snapshotDate: new Date(),
    },
  });

  return snapshot;
}

/**
 * Get portfolio trend data for the last N days
 */
export async function getPortfolioTrends(
  organizationId: string,
  days: number = 30
): Promise<PortfolioTrendData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: {
      organizationId,
      snapshotDate: { gte: startDate },
    },
    orderBy: { snapshotDate: 'asc' },
  });

  return snapshots.map((snapshot: any, index: number) => {
    const totalValue = parseFloat(snapshot.totalValue.toString());
    const prevValue = index > 0 ? parseFloat(snapshots[index - 1].totalValue.toString()) : totalValue;
    const growth = prevValue > 0 ? ((totalValue - prevValue) / prevValue) * 100 : 0;

    return {
      date: snapshot.snapshotDate.toISOString().split('T')[0],
      totalValue,
      totalItems: snapshot.totalItems,
      verifiedItems: snapshot.verifiedItems,
      pendingItems: snapshot.pendingItems,
      growth: parseFloat(growth.toFixed(2)),
    };
  });
}

/**
 * Get category-wise trend data
 */
export async function getCategoryTrends(
  organizationId: string,
  days: number = 30
): Promise<CategoryTrend[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: {
      organizationId,
      snapshotDate: { gte: startDate },
    },
    orderBy: { snapshotDate: 'asc' },
  });

  // Extract unique categories
  const categoryMap = new Map<string, CategoryTrend>();

  snapshots.forEach((snapshot: any) => {
    const breakdown = snapshot.categoryBreakdown as any[];
    const date = snapshot.snapshotDate.toISOString().split('T')[0];

    breakdown.forEach((cat: any) => {
      if (!categoryMap.has(cat.categoryId)) {
        categoryMap.set(cat.categoryId, {
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          categorySlug: cat.categorySlug,
          values: [],
        });
      }

      const trend = categoryMap.get(cat.categoryId)!;
      trend.values.push({
        date,
        value: cat.totalValue,
        itemCount: cat.itemCount,
      });
    });
  });

  return Array.from(categoryMap.values());
}

/**
 * Get portfolio insights and statistics
 */
export async function getPortfolioInsights(
  organizationId: string,
  days: number = 90
): Promise<PortfolioInsights> {
  const trends = await getPortfolioTrends(organizationId, days);

  if (trends.length === 0) {
    return {
      currentValue: 0,
      previousValue: 0,
      growthRate: 0,
      growthAmount: 0,
      highestValue: 0,
      lowestValue: 0,
      averageValue: 0,
      volatility: 0,
    };
  }

  const values = trends.map((t) => t.totalValue);
  const currentValue = values[values.length - 1];
  const previousValue = values.length > 1 ? values[values.length - 2] : currentValue;
  const growthAmount = currentValue - previousValue;
  const growthRate = previousValue > 0 ? (growthAmount / previousValue) * 100 : 0;

  const highestValue = Math.max(...values);
  const lowestValue = Math.min(...values);
  const averageValue = values.reduce((sum, val) => sum + val, 0) / values.length;

  // Calculate volatility (standard deviation as percentage of mean)
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - averageValue, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const volatility = averageValue > 0 ? (stdDev / averageValue) * 100 : 0;

  return {
    currentValue: parseFloat(currentValue.toFixed(2)),
    previousValue: parseFloat(previousValue.toFixed(2)),
    growthRate: parseFloat(growthRate.toFixed(2)),
    growthAmount: parseFloat(growthAmount.toFixed(2)),
    highestValue: parseFloat(highestValue.toFixed(2)),
    lowestValue: parseFloat(lowestValue.toFixed(2)),
    averageValue: parseFloat(averageValue.toFixed(2)),
    volatility: parseFloat(volatility.toFixed(2)),
  };
}

/**
 * Get current portfolio summary (without historical tracking)
 */
export async function getCurrentPortfolioSummary(organizationId: string) {
  const items = await prisma.item.findMany({
    where: { organizationId },
    include: { category: true },
  });

  const totalValue = items.reduce(
    (sum: any, item: any) => sum.add(item.estimatedValue || new Decimal(0)),
    new Decimal(0)
  );
  const totalItems = items.length;
  const verifiedItems = items.filter((item: any) => item.status === 'verified').length;
  const pendingItems = items.filter((item: any) => item.status === 'pending').length;
  const flaggedItems = items.filter((item: any) => item.status === 'flagged').length;

  // Category breakdown
  const categoryBreakdown: Record<string, any> = {};
  items.forEach((item: any) => {
    const catId = item.categoryId;
    if (!categoryBreakdown[catId]) {
      categoryBreakdown[catId] = {
        categoryId: catId,
        categoryName: item.category.name,
        categorySlug: item.category.slug,
        totalValue: new Decimal(0),
        itemCount: 0,
      };
    }
    categoryBreakdown[catId].totalValue = categoryBreakdown[catId].totalValue.add(
      item.estimatedValue || new Decimal(0)
    );
    categoryBreakdown[catId].itemCount += 1;
  });

  // Convert to array and format
  const categories = Object.values(categoryBreakdown).map((cat: any) => ({
    categoryId: cat.categoryId,
    categoryName: cat.categoryName,
    categorySlug: cat.categorySlug,
    totalValue: parseFloat(cat.totalValue.toString()),
    itemCount: cat.itemCount,
    percentage:
      parseFloat(totalValue.toString()) > 0
        ? (parseFloat(cat.totalValue.toString()) / parseFloat(totalValue.toString())) * 100
        : 0,
  }));

  return {
    totalValue: parseFloat(totalValue.toString()),
    totalItems,
    verifiedItems,
    pendingItems,
    flaggedItems,
    categories,
  };
}
