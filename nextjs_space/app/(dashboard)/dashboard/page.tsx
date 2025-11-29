import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AnalyticsCharts from '@/components/dashboard/analytics-charts';
import Link from 'next/link';
import { Package, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, Activity } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  // Fetch real statistics from the database
  const totalItems = await prisma.item.count({
    where: { organizationId: user?.organizationId },
  });

  const pendingItems = await prisma.item.count({
    where: { 
      organizationId: user?.organizationId,
      status: 'pending'
    },
  });

  const verifiedItems = await prisma.item.count({
    where: { 
      organizationId: user?.organizationId,
      status: 'verified'
    },
  });

  const flaggedItems = await prisma.item.count({
    where: { 
      organizationId: user?.organizationId,
      status: 'flagged'
    },
  });

  // Fetch items grouped by category
  const itemsByCategory = await prisma.item.groupBy({
    by: ['categoryId'],
    where: {
      organizationId: user?.organizationId,
    },
    _count: true,
    _sum: {
      estimatedValue: true,
    },
  });

  // Get category names
  const categories = await prisma.itemCategory.findMany();
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const categoryData = itemsByCategory.map((item) => ({
    name: categoryMap.get(item.categoryId) || 'Unknown',
    value: item._count,
    totalValue: Number(item._sum.estimatedValue || 0),
  }));

  // Calculate total portfolio value
  const totalValue = categoryData.reduce((sum, cat) => sum + cat.totalValue, 0);

  // Fetch items ordered by creation date for value over time chart
  const items = await prisma.item.findMany({
    where: {
      organizationId: user?.organizationId,
      estimatedValue: { not: null },
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      createdAt: true,
      estimatedValue: true,
    },
  });

  // Build cumulative value over time
  const valueOverTime: Array<{ date: string; value: number }> = [];
  let cumulativeValue = 0;
  
  items.forEach((item) => {
    cumulativeValue += Number(item.estimatedValue || 0);
    valueOverTime.push({
      date: new Date(item.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      value: cumulativeValue,
    });
  });

  // Get team member count
  const teamMemberCount = await prisma.teamMember.count({
    where: { organizationId: user?.organizationId },
  });

  // Get recent activity
  const recentActivity = await prisma.auditLog.findMany({
    where: { userId: user?.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      user: {
        select: {
          fullName: true,
        },
      },
    },
  });
  const stats = [
    {
      title: 'Total Items',
      value: totalItems.toString(),
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pending Review',
      value: pendingItems.toString(),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Verified',
      value: verifiedItems.toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Flagged',
      value: flaggedItems.toString(),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
          Welcome back, {user?.name?.split(' ')?.[0] ?? 'User'}!
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your luxury asset provenance records and documentation.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <AnalyticsCharts
          categoryData={categoryData}
          valueOverTime={valueOverTime}
          totalValue={totalValue}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total estimated value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMemberCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active collaborators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalItems > 0 ? Math.round((verifiedItems / totalItems) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Verified assets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with Genesis Provenance
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link href="/vault/add-asset">
            <Button className="bg-navy-600 hover:bg-navy-700">
              <Package className="mr-2 h-4 w-4" />
              Add New Asset
            </Button>
          </Link>
          <Link href="/vault">
            <Button variant="outline">
              View All Items
            </Button>
          </Link>
          <Link href="/team">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Manage Team
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest provenance updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="p-2 bg-navy-100 rounded-full">
                    <Activity className="h-4 w-4 text-navy-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium">No activity yet</p>
              <p className="mt-2 text-sm">Start by adding your first luxury asset to build your provenance record.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
