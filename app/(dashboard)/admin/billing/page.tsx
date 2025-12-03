'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  UserMinus,
  ArrowUpCircle,
  BarChart3,
  AlertCircle,
  RefreshCw,
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface RevenueMetrics {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  newSubscriptionsThisMonth: number;
  churnedSubscriptionsThisMonth: number;
  churnRate: number;
  arpu: number;
  byPlan: {
    plan: string;
    count: number;
    mrr: number;
    percentage: number;
  }[];
  growth: {
    mrrGrowth: number;
    subscriptionGrowth: number;
  };
}

interface UpgradeOpportunity {
  organizationId: string;
  organizationName: string;
  currentPlan: string;
  suggestedPlan: string;
  reason: string;
  usagePercentage: number;
  potentialMRRIncrease: number;
}

interface UsageTrend {
  feature: string;
  totalUsage: number;
  averagePerOrg: number;
  topUsers: {
    organizationId: string;
    organizationName: string;
    usage: number;
    plan: string;
    approachingLimit: boolean;
  }[];
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  createdAt: string;
  currentPeriodEnd: string;
  organization: {
    id: string;
    name: string;
    type: string;
    _count: {
      users: number;
      items: number;
    };
  };
}

const PLAN_LABELS: { [key: string]: string } = {
  collector: 'Collector',
  dealer: 'Dealer',
  enterprise: 'Enterprise',
};

const STATUS_CONFIG: { [key: string]: { label: string; icon: any; className: string } } = {
  active: { 
    label: 'Active', 
    icon: CheckCircle2, 
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
  },
  trialing: { 
    label: 'Trialing', 
    icon: Clock, 
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
  },
  past_due: { 
    label: 'Past Due', 
    icon: AlertCircle, 
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' 
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: XCircle, 
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' 
  },
};

export default function AdminBillingPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [upgradeOpportunities, setUpgradeOpportunities] = useState<UpgradeOpportunity[]>([]);
  const [usageTrends, setUsageTrends] = useState<UsageTrend[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'usage'>('overview');

  // Auth check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user && (session.user as any).role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'Admin access required',
        variant: 'destructive',
      });
      router.push('/dashboard');
    }
  }, [session, status, router, toast]);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);

      const [overviewRes, subscriptionsRes, trendsRes] = await Promise.all([
        fetch('/api/admin/billing/overview'),
        fetch('/api/admin/billing/subscriptions'),
        fetch('/api/admin/billing/usage-trends'),
      ]);

      if (!overviewRes.ok || !subscriptionsRes.ok || !trendsRes.ok) {
        throw new Error('Failed to fetch billing data');
      }

      const overviewData = await overviewRes.json();
      const subscriptionsData = await subscriptionsRes.json();
      const trendsData = await trendsRes.json();

      setRevenueMetrics(overviewData.revenue);
      setUpgradeOpportunities(overviewData.upgradeOpportunities);
      setSubscriptions(subscriptionsData.subscriptions);
      setUsageTrends(trendsData.trends);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user && (session.user as any).role === 'admin') {
      fetchData();
    }
  }, [session]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Billing data updated',
    });
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
    if (planFilter !== 'all' && sub.plan !== planFilter) return false;
    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Revenue analytics, subscription management, and upgrade opportunities
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-4 py-2 font-medium border-b-2 transition-colors',
            activeTab === 'overview'
              ? 'border-gold-500 text-gold-600 dark:text-gold-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <BarChart3 className="h-4 w-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={cn(
            'px-4 py-2 font-medium border-b-2 transition-colors',
            activeTab === 'subscriptions'
              ? 'border-gold-500 text-gold-600 dark:text-gold-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Subscriptions
        </button>
        <button
          onClick={() => setActiveTab('usage')}
          className={cn(
            'px-4 py-2 font-medium border-b-2 transition-colors',
            activeTab === 'usage'
              ? 'border-gold-500 text-gold-600 dark:text-gold-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <TrendingUp className="h-4 w-4 inline mr-2" />
          Usage Trends
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && revenueMetrics && (
        <div className="space-y-6">
          {/* Revenue Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">MRR</p>
                  <p className="text-3xl font-bold mt-2">
                    {formatCurrency(revenueMetrics.mrr)}
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    {revenueMetrics.growth.mrrGrowth >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={revenueMetrics.growth.mrrGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPercentage(revenueMetrics.growth.mrrGrowth)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gold-100 dark:bg-gold-900/20 rounded-lg">
                  <DollarSign className="h-6 w-6 text-gold-600 dark:text-gold-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ARR</p>
                  <p className="text-3xl font-bold mt-2">
                    {formatCurrency(revenueMetrics.arr)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Annualized
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                  <p className="text-3xl font-bold mt-2">
                    {revenueMetrics.activeSubscriptions}
                  </p>
                  <div className="flex items-center mt-2 text-sm">
                    {revenueMetrics.growth.subscriptionGrowth >= 0 ? (
                      <UserPlus className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <UserMinus className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={revenueMetrics.growth.subscriptionGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPercentage(revenueMetrics.growth.subscriptionGrowth)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Churn Rate</p>
                  <p className="text-3xl font-bold mt-2">
                    {revenueMetrics.churnRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {revenueMetrics.churnedSubscriptionsThisMonth} this month
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <UserMinus className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </Card>
          </div>

          {/* Plan Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue by Plan</h3>
            <div className="space-y-4">
              {revenueMetrics.byPlan.map((plan) => (
                <div key={plan.plan} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{PLAN_LABELS[plan.plan]}</span>
                      <span className="text-sm text-muted-foreground">
                        {plan.count} subscribers · {formatCurrency(plan.mrr)}/mo
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold-500"
                        style={{ width: `${plan.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Upgrade Opportunities */}
          {upgradeOpportunities.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-gold-500" />
                  Upgrade Opportunities
                </h3>
                <Badge variant="outline" className="bg-gold-100 text-gold-700 dark:bg-gold-900/20 dark:text-gold-400">
                  {upgradeOpportunities.length} organizations
                </Badge>
              </div>
              <div className="space-y-3">
                {upgradeOpportunities.slice(0, 5).map((opp) => (
                  <div key={opp.organizationId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{opp.organizationName}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {opp.reason}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">
                          {PLAN_LABELS[opp.currentPlan]} → {PLAN_LABELS[opp.suggestedPlan]}
                        </Badge>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          +{formatCurrency(opp.potentialMRRIncrease)}/mo
                        </p>
                      </div>
                      <ArrowUpCircle className="h-5 w-5 text-gold-500" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="collector">Collector</SelectItem>
                <SelectItem value="dealer">Dealer</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subscriptions Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assets</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((sub) => {
                  const statusConfig = STATUS_CONFIG[sub.status] || STATUS_CONFIG.active;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sub.organization.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {sub.organization.type}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {PLAN_LABELS[sub.plan]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{sub.organization._count.items}</TableCell>
                      <TableCell>{sub.organization._count.users}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/billing/${sub.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Usage Trends Tab */}
      {activeTab === 'usage' && (
        <div className="space-y-4">
          {usageTrends.map((trend) => (
            <Card key={trend.feature} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold capitalize">
                    {trend.feature.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Total: {trend.totalUsage.toLocaleString()} · Average: {trend.averagePerOrg.toLocaleString()} per org
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Top Users (Last 30 days)</p>
                {trend.topUsers.map((user) => (
                  <div key={user.organizationId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{user.organizationName}</p>
                      <Badge variant="outline" className="mt-1">
                        {PLAN_LABELS[user.plan]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {user.usage.toLocaleString()} uses
                      </span>
                      {user.approachingLimit && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Near Limit
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
