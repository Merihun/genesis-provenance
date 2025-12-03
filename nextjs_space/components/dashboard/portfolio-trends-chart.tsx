'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/pdf-generator';

interface PortfolioTrendData {
  date: string;
  totalValue: number;
  totalItems: number;
  verifiedItems: number;
  pendingItems: number;
  growth: number;
}

interface CategoryTrend {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  values: {
    date: string;
    value: number;
    itemCount: number;
  }[];
}

interface PortfolioTrendsChartProps {
  trends: PortfolioTrendData[];
  categoryTrends?: CategoryTrend[];
  type?: 'value' | 'items' | 'category';
}

const COLORS = [
  '#d4af37', // Gold
  '#60a5fa', // Blue
  '#34d399', // Green
  '#f87171', // Red
  '#a78bfa', // Purple
  '#fb923c', // Orange
  '#ec4899', // Pink
];

export function PortfolioTrendsChart({
  trends,
  categoryTrends,
  type = 'value',
}: PortfolioTrendsChartProps) {
  const formattedTrends = useMemo(() => {
    return trends.map((trend: PortfolioTrendData) => ({
      ...trend,
      date: new Date(trend.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));
  }, [trends]);

  const categoryChartData = useMemo(() => {
    if (!categoryTrends || categoryTrends.length === 0) return [];

    // Create a map of dates to category values
    const dateMap = new Map<string, any>();

    categoryTrends.forEach((catTrend: CategoryTrend) => {
      catTrend.values.forEach((val) => {
        const formattedDate = new Date(val.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        if (!dateMap.has(formattedDate)) {
          dateMap.set(formattedDate, { date: formattedDate });
        }

        dateMap.get(formattedDate)[catTrend.categoryName] = val.value;
      });
    });

    return Array.from(dateMap.values());
  }, [categoryTrends]);

  if (type === 'value') {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Portfolio Value Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={formattedTrends}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d4af37" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#d4af37" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              stroke="currentColor"
            />
            <YAxis
              className="text-xs"
              stroke="currentColor"
              tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [formatCurrency(value), 'Total Value']}
            />
            <Area
              type="monotone"
              dataKey="totalValue"
              stroke="#d4af37"
              strokeWidth={2}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    );
  }

  if (type === 'items') {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Asset Count Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedTrends}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              stroke="currentColor"
            />
            <YAxis className="text-xs" stroke="currentColor" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="totalItems"
              stroke="#d4af37"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Total Assets"
            />
            <Line
              type="monotone"
              dataKey="verifiedItems"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Verified"
            />
            <Line
              type="monotone"
              dataKey="pendingItems"
              stroke="#f87171"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Pending"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    );
  }

  if (type === 'category' && categoryTrends && categoryTrends.length > 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Value by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryChartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              stroke="currentColor"
            />
            <YAxis
              className="text-xs"
              stroke="currentColor"
              tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />
            {categoryTrends.map((catTrend: CategoryTrend, index: number) => (
              <Bar
                key={catTrend.categoryId}
                dataKey={catTrend.categoryName}
                fill={COLORS[index % COLORS.length]}
                stackId="a"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>
    );
  }

  return null;
}
