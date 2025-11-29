import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  const stats = [
    {
      title: 'Total Items',
      value: '0',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pending Review',
      value: '0',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Verified',
      value: '0',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Flagged',
      value: '0',
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with Genesis Provenance
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link href="/vault">
            <Button className="bg-blue-900 hover:bg-blue-800">
              <Package className="mr-2 h-4 w-4" />
              Add New Asset
            </Button>
          </Link>
          <Link href="/vault">
            <Button variant="outline">
              View All Items
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
          <div className="text-center py-12 text-gray-500">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium">No activity yet</p>
            <p className="mt-2 text-sm">Start by adding your first luxury asset to build your provenance record.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
