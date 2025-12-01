'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
  User,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

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
  stripeCustomerId?: string | null;
}

export default function BillingPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession() || {};
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'collector' | 'dealer' | 'enterprise'>('dealer');
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const settingsNav = [
    { name: 'Profile', href: '/settings', icon: User },
    { name: 'Billing', href: '/settings/billing', icon: CreditCard },
  ];

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session?.user) return;

    fetchBillingData();
  }, [session, sessionStatus]);

  // Handle success/cancel redirects from Stripe Checkout
  useEffect(() => {
    const success = searchParams?.get('success');
    const canceled = searchParams?.get('canceled');

    if (success === 'true') {
      toast({
        title: 'Success!',
        description: 'Your subscription has been updated successfully.',
      });
      // Remove query params and refresh data
      window.history.replaceState(null, '', '/settings/billing');
      fetchBillingData();
    } else if (canceled === 'true') {
      toast({
        title: 'Canceled',
        description: 'Subscription upgrade was canceled.',
        variant: 'destructive',
      });
      // Remove query params
      window.history.replaceState(null, '', '/settings/billing');
    }
  }, [searchParams]);

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

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          billingCycle: selectedCycle,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to create checkout session',
          variant: 'destructive',
        });
        setIsUpgrading(false);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate upgrade',
        variant: 'destructive',
      });
      setIsUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Open Stripe Customer Portal
        window.location.href = data.url;
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to open customer portal',
          variant: 'destructive',
        });
        setIsOpeningPortal(false);
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        title: 'Error',
        description: 'Failed to open subscription management',
        variant: 'destructive',
      });
      setIsOpeningPortal(false);
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
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        {settingsNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
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
          <div className="flex gap-2">
            {subscriptionData?.status === 'active' && subscriptionData.stripeCustomerId ? (
              <Button
                onClick={handleManageSubscription}
                disabled={isOpeningPortal}
                variant="outline"
                className="gap-2"
              >
                {isOpeningPortal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Manage Subscription
              </Button>
            ) : null}
            {usageData && usageData.plan !== 'enterprise' && (
              <Button
                onClick={() => setShowUpgradeDialog(true)}
                disabled={isUpgrading}
                className="gap-2"
              >
                <ArrowUpCircle className="h-4 w-4" />
                Upgrade Plan
              </Button>
            )}
          </div>
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

      {/* Payment Method */}
      {subscriptionData?.status === 'active' && subscriptionData.stripeCustomerId && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Payment Method</h2>
              <p className="text-sm text-muted-foreground">
                Manage your payment methods, view invoices, and update billing details
              </p>
            </div>
            <Button
              onClick={handleManageSubscription}
              disabled={isOpeningPortal}
              variant="outline"
              className="gap-2"
            >
              {isOpeningPortal ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Manage
            </Button>
          </div>
        </Card>
      )}

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>
              Choose a plan that fits your needs and unlock more features.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Plan Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Select Plan</Label>
              <RadioGroup value={selectedPlan} onValueChange={(value: any) => setSelectedPlan(value)}>
                <div className="space-y-3">
                  {/* Dealer Plan */}
                  {usageData && usageData.plan !== 'dealer' && usageData.plan !== 'enterprise' && (
                    <Label
                      htmlFor="dealer"
                      className="flex items-start space-x-3 space-y-0 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                    >
                      <RadioGroupItem value="dealer" id="dealer" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Dealer</span>
                          <Badge>Most Popular</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Perfect for dealerships and resellers
                        </p>
                        <p className="text-sm font-medium mt-2">
                          {selectedCycle === 'monthly' ? '$99/month' : '$990/year (save $198)'}
                        </p>
                        <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3" /> 500 assets
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3" /> 5 team members
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3" /> 250 AI analyses/month
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3" /> Advanced analytics
                          </li>
                        </ul>
                      </div>
                    </Label>
                  )}

                  {/* Enterprise Plan */}
                  {usageData && usageData.plan !== 'enterprise' && (
                    <Label
                      htmlFor="enterprise"
                      className="flex items-start space-x-3 space-y-0 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                    >
                      <RadioGroupItem value="enterprise" id="enterprise" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Enterprise</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          For large organizations with complex needs
                        </p>
                        <p className="text-sm font-medium mt-2">
                          {selectedCycle === 'monthly' ? '$399/month' : '$3,990/year (save $798)'}
                        </p>
                        <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3" /> Unlimited assets
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3" /> Unlimited team members
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3" /> Unlimited AI analyses
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3" /> Priority support + API access
                          </li>
                        </ul>
                      </div>
                    </Label>
                  )}
                </div>
              </RadioGroup>
            </div>

            {/* Billing Cycle Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Billing Cycle</Label>
              <RadioGroup value={selectedCycle} onValueChange={(value: any) => setSelectedCycle(value)}>
                <div className="grid grid-cols-2 gap-3">
                  <Label
                    htmlFor="monthly"
                    className="flex flex-col items-center justify-center border rounded-lg p-4 cursor-pointer hover:bg-accent"
                  >
                    <RadioGroupItem value="monthly" id="monthly" className="mb-2" />
                    <span className="font-medium">Monthly</span>
                    <span className="text-xs text-muted-foreground">Pay monthly</span>
                  </Label>
                  <Label
                    htmlFor="annual"
                    className="flex flex-col items-center justify-center border rounded-lg p-4 cursor-pointer hover:bg-accent"
                  >
                    <RadioGroupItem value="annual" id="annual" className="mb-2" />
                    <span className="font-medium">Annual</span>
                    <span className="text-xs text-green-600">Save 2 months</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowUpgradeDialog(false)}
              disabled={isUpgrading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={isUpgrading}>
              {isUpgrading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue to Checkout'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
