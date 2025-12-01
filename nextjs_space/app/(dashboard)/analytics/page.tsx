'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PortfolioTrendsChart } from '@/components/dashboard/portfolio-trends-chart';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  CheckCircle2,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '@/lib/pdf-generator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PortfolioInsights {
  currentValue: number;
  previousValue: number;
  growthRate: number;
  growthAmount: number;
  highestValue: number;
  lowestValue: number;
  averageValue: number;
  volatility: number;
}

interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  totalValue: number;
  itemCount: number;
  percentage: number;
}

interface PortfolioSummary {
  totalValue: number;
  totalItems: number;
  verifiedItems: number;
  pendingItems: number;
  flaggedItems: number;
  categories: CategoryBreakdown[];
}

interface AnalyticsData {
  summary: PortfolioSummary;
  trends: any[];
  insights?: PortfolioInsights;
  categoryTrends?: any[];
  periodDays: number;
  generatedAt: string;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodDays, setPeriodDays] = useState(30);

  // Fetch analytics data
  const fetchAnalytics = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      const response = await fetch(
        `/api/analytics/portfolio?days=${periodDays}&includeInsights=true&includeCategoryTrends=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAnalytics();
    } else if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, periodDays, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const { summary, trends, insights, categoryTrends } = data;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Insights and trends for your luxury asset collection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border rounded-lg p-1">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                variant={periodDays === days ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriodDays(days)}
                disabled={refreshing}
              >
                {days}d
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(false)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Current Value */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
              <h2 className="text-2xl font-bold mt-2">
                {formatCurrency(summary.totalValue)}
              </h2>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
          {insights && (
            <div className="mt-4 flex items-center gap-2">
              {insights.growthRate > 0 ? (
                <ArrowUpCircle className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownCircle className="h-4 w-4 text-red-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  insights.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {insights.growthRate > 0 ? '+' : ''}{insights.growthRate.toFixed(2)}%
              </span>
              <span className="text-xs text-muted-foreground">vs. previous period</span>
            </div>
          )}
        </Card>

        {/* Total Assets */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
              <h2 className="text-2xl font-bold mt-2">{summary.totalItems}</h2>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium">{summary.verifiedItems}</span>
              <span className="text-muted-foreground">verified</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{summary.pendingItems}</span>
              <span className="text-muted-foreground">pending</span>
            </div>
          </div>
        </Card>

        {/* Average Value */}
        {insights && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Value</p>
                <h2 className="text-2xl font-bold mt-2">
                  {formatCurrency(insights.averageValue)}
                </h2>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-1 text-xs text-muted-foreground">
              <div>High: {formatCurrency(insights.highestValue)}</div>
              <div>Low: {formatCurrency(insights.lowestValue)}</div>
            </div>
          </Card>
        )}

        {/* Volatility */}
        {insights && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volatility</p>
                <h2 className="text-2xl font-bold mt-2">
                  {insights.volatility.toFixed(1)}%
                </h2>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <div className="mt-4">
              <Badge
                variant={insights.volatility < 10 ? 'default' : 'secondary'}
                className="text-xs"
              >
                {insights.volatility < 10 ? 'Low' : insights.volatility < 20 ? 'Moderate' : 'High'}
              </Badge>
            </div>
          </Card>
        )}
      </div>

      {/* Charts */}
      <Tabs defaultValue="value" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="value">Value Trends</TabsTrigger>
          <TabsTrigger value="items">Asset Counts</TabsTrigger>
          <TabsTrigger value="category">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="value">
          <PortfolioTrendsChart trends={trends} type="value" />
        </TabsContent>

        <TabsContent value="items">
          <PortfolioTrendsChart trends={trends} type="items" />
        </TabsContent>

        <TabsContent value="category">
          <PortfolioTrendsChart
            trends={trends}
            categoryTrends={categoryTrends}
            type="category"
          />
        </TabsContent>
      </Tabs>

      {/* Category Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Portfolio Composition</h3>
        <div className="space-y-4">
          {summary.categories.map((category: CategoryBreakdown) => (
            <div key={category.categoryId} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{category.categoryName}</span>
                  <Badge variant="outline" className="text-xs">
                    {category.itemCount} {category.itemCount === 1 ? 'item' : 'items'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">
                    {formatCurrency(category.totalValue)}
                  </span>
                  <span className="text-muted-foreground">
                    {category.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
