'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useRouter } from 'next/navigation';

interface AnalyticsChartsProps {
  categoryData: Array<{ categoryId: string; name: string; value: number; totalValue: number }>;
  valueOverTime: Array<{ date: string; value: number }>;
  totalValue: number;
}

const COLORS = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#fbbf24', '#f59e0b'];

export default function AnalyticsCharts({ categoryData, valueOverTime, totalValue }: AnalyticsChartsProps) {
  const router = useRouter();

  const handlePieClick = (data: any) => {
    if (data && data.categoryId) {
      router.push(`/vault?category=${data.categoryId}`);
    }
  };
  return (
    <>
      {/* Portfolio Value Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Total Portfolio Value</CardTitle>
          <CardDescription>Estimated market value of all verified assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-navy-600">
            ${totalValue.toLocaleString()}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Based on current market estimates
          </p>
        </CardContent>
      </Card>

      {/* Asset Distribution by Category */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Asset Distribution by Category</CardTitle>
          <CardDescription>Click on any segment to view items in that category</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={handlePieClick}
                  cursor="pointer"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Value Distribution */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Value Distribution by Category</CardTitle>
          <CardDescription>Total value per category</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <div className="space-y-4">
              {categoryData
                .filter((cat) => cat.totalValue > 0)
                .sort((a, b) => b.totalValue - a.totalValue)
                .map((cat, index) => {
                  const percentage = totalValue > 0 ? (cat.totalValue / totalValue) * 100 : 0;
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{cat.name}</span>
                        <span className="text-gray-600">${cat.totalValue.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Value Over Time */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Portfolio Value Growth</CardTitle>
          <CardDescription>Asset value accumulation over time</CardDescription>
        </CardHeader>
        <CardContent>
          {valueOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={valueOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Value']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1e3a8a"
                  strokeWidth={2}
                  dot={{ fill: '#1e3a8a', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
