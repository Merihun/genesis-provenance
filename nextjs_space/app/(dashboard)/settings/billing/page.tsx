'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  TrendingUp,
  Users,
  Database,
  Zap,
  Car,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowUpCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface UsageData {
  plan: string;
  limits: {
    assets: number;
    teamMembers: number;
    aiAnalysesPerMonth: number;
    storageGB: number;
    vinLookupsPerMonth: number;
  };
  usage: {
    assets: number;
    teamMembers: number;
    aiAnalyses: number;
    vinLookups: number;
    pdfCertificates: number;
  };
  periodStart: string;
  periodEnd: string;
}

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export default function BillingPage() {
  const { data: session, status: sessionStatus } = useSession() || {};
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session?.user) return;

    fetchBillingData();
  }, [session, sessionStatus]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      // Fetch usage data
      const usageRes = await fetch('/api/billing/usage');
      if (usageRes.ok) {
        const data = await usageRes.json();
        setUsageData(data);
      }

      // Fetch subscription data
      const subRes = await fetch('/api/billing/subscription');
      if (subRes.ok) {
        const data = await subRes.json();
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanDisplayName = (plan: string) => {
    const names: Record<string, string> = {
      collector: 'Collector',
      dealer: 'Dealer',
      enterprise: 'Enterprise',
    };
    return names[plan] || plan;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      active: { variant: 'default' as any, label: 'Active' },
      trialing: { variant: 'secondary' as any, label: 'Trial' },
      past_due: { variant: 'destructive' as any, label: 'Past Due' },
      canceled: { variant: 'outline' as any, label: 'Canceled' },
      incomplete: { variant: 'destructive' as any, label: 'Incomplete' },
    };
    const config = variants[status] || { variant: 'outline' as any, label: status };
    return (
      <Badge variant={config.variant} className="ml-2">
        {config.label}
      </Badge>
    );
  };

  const calculatePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription plan and track usage
        </p>
      </div>

      {/* Current Plan Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-blue-500 mr-2" />
              <h2 className="text-xl font-semibold">Current Plan</h2>
              {subscriptionData && getStatusBadge(subscriptionData.status)}
            </div>
            <p className="text-2xl font-bold mt-2 text-[#d4af37]">
              {usageData ? getPlanDisplayName(usageData.plan) : 'Loading...'}
            </p>
            {subscriptionData?.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground mt-1">
                {subscriptionData.cancelAtPeriodEnd
                  ? `Cancels on ${new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}`
                  : `Renews on ${new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()}`}
              </p>
            )}
          </div>
          <Button disabled className="gap-2">
            <ArrowUpCircle className="h-4 w-4" />
            Upgrade (Coming in Phase 5B)
          </Button>
        </div>
      </Card>

      {/* Usage Summary */}
      {usageData && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Usage This Period</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {new Date(usageData.periodStart).toLocaleDateString()} -{' '}
            {new Date(usageData.periodEnd).toLocaleDateString()}
          </p>

          <div className="space-y-6">
            {/* Assets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Assets</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usageData.usage.assets} /{' '}
                  {usageData.limits.assets === -1 ? 'Unlimited' : usageData.limits.assets}
                </span>
              </div>
              {usageData.limits.assets !== -1 && (
                <Progress
                  value={calculatePercentage(usageData.usage.assets, usageData.limits.assets)}
                  className="h-2"
                />
              )}
            </div>

            {/* Team Members */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Team Members</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usageData.usage.teamMembers} /{' '}
                  {usageData.limits.teamMembers === -1 ? 'Unlimited' : usageData.limits.teamMembers}
                </span>
              </div>
              {usageData.limits.teamMembers !== -1 && (
                <Progress
                  value={calculatePercentage(usageData.usage.teamMembers, usageData.limits.teamMembers)}
                  className="h-2"
                />
              )}
            </div>

            {/* AI Analyses */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">AI Analyses</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usageData.usage.aiAnalyses} /{' '}
                  {usageData.limits.aiAnalysesPerMonth === -1
                    ? 'Unlimited'
                    : usageData.limits.aiAnalysesPerMonth}
                </span>
              </div>
              {usageData.limits.aiAnalysesPerMonth !== -1 && (
                <Progress
                  value={calculatePercentage(
                    usageData.usage.aiAnalyses,
                    usageData.limits.aiAnalysesPerMonth
                  )}
                  className="h-2"
                />
              )}
            </div>

            {/* VIN Lookups */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">VIN Lookups</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usageData.usage.vinLookups} /{' '}
                  {usageData.limits.vinLookupsPerMonth === -1
                    ? 'Unlimited'
                    : usageData.limits.vinLookupsPerMonth}
                </span>
              </div>
              {usageData.limits.vinLookupsPerMonth !== -1 && (
                <Progress
                  value={calculatePercentage(
                    usageData.usage.vinLookups,
                    usageData.limits.vinLookupsPerMonth
                  )}
                  className="h-2"
                />
              )}
            </div>

            {/* Storage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">Storage</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  0 GB / {usageData.limits.storageGB === -1 ? 'Unlimited' : `${usageData.limits.storageGB} GB`}
                </span>
              </div>
              {usageData.limits.storageGB !== -1 && (
                <Progress value={0} className="h-2" />
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Features Included */}
      {usageData && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Features Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>PDF Certificates</span>
            </div>
            {usageData.plan === 'dealer' || usageData.plan === 'enterprise' ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Advanced Analytics</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-gray-400" />
                <span className="text-muted-foreground">Advanced Analytics</span>
              </div>
            )}
            {usageData.plan === 'enterprise' ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Priority Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>API Access</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-muted-foreground">Priority Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-muted-foreground">API Access</span>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Payment Method - Placeholder */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
        <p className="text-muted-foreground">
          Payment management will be available in Phase 5B through Stripe Customer Portal.
        </p>
      </Card>
    </div>
  );
}
