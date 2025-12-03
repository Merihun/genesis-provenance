'use client';

import { AlertCircle, ArrowUpCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UpgradePromptProps {
  feature: string;
  currentPlan: string;
  limit: number;
  current: number;
  variant?: 'alert' | 'card' | 'inline';
  onDismiss?: () => void;
}

export function UpgradePrompt({
  feature,
  currentPlan,
  limit,
  current,
  variant = 'alert',
  onDismiss,
}: UpgradePromptProps) {
  const displayPlan = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);
  const message = `You've reached your ${displayPlan} plan limit of ${limit} ${feature.toLowerCase()}. Upgrade to continue.`;

  if (variant === 'card') {
    return (
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Upgrade to unlock more {feature}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You're currently using {current} of {limit} {feature.toLowerCase()} on the {displayPlan} plan.
            </p>
            <div className="flex gap-2">
              <Link href="/settings/billing">
                <Button className="gap-2">
                  <ArrowUpCircle className="h-4 w-4" />
                  Upgrade Now
                </Button>
              </Link>
              {onDismiss && (
                <Button variant="outline" onClick={onDismiss}>
                  Maybe Later
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-amber-900">
            <span className="font-medium">Limit reached:</span> {message}
          </p>
        </div>
        <Link href="/settings/billing">
          <Button size="sm" variant="default" className="gap-1">
            <ArrowUpCircle className="h-3 w-3" />
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  // Default: alert variant
  return (
    <Alert variant="default" className="border-amber-200 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900">Upgrade Required</AlertTitle>
      <AlertDescription className="text-amber-800">
        <div className="flex items-center justify-between">
          <span>{message}</span>
          <Link href="/settings/billing">
            <Button size="sm" variant="default" className="gap-1 ml-4">
              <ArrowUpCircle className="h-3 w-3" />
              Upgrade Plan
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}
