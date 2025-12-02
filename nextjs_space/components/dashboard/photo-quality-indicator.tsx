'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  Lightbulb,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PhotoQuality } from '@/lib/smart-upload';

interface PhotoQualityIndicatorProps {
  quality: PhotoQuality;
  compact?: boolean;
}

export function PhotoQualityIndicator({ quality, compact = false }: PhotoQualityIndicatorProps) {
  const getQualityIcon = () => {
    switch (quality.overall) {
      case 'excellent':
      case 'good':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'fair':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'poor':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getQualityColor = () => {
    switch (quality.overall) {
      case 'excellent':
        return 'border-green-200 bg-green-50/50';
      case 'good':
        return 'border-green-200 bg-green-50/30';
      case 'fair':
        return 'border-yellow-200 bg-yellow-50/50';
      case 'poor':
        return 'border-red-200 bg-red-50/50';
    }
  };

  const getQualityText = () => {
    switch (quality.overall) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
    }
  };

  const getQualityBadgeColor = () => {
    switch (quality.overall) {
      case 'excellent':
      case 'good':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'poor':
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getQualityIcon()}
        <span className="text-sm font-medium">Photo Quality: {getQualityText()}</span>
        <Badge variant="outline" className={cn('text-xs', getQualityBadgeColor())}>
          {quality.score}%
        </Badge>
      </div>
    );
  }

  return (
    <Card className={cn('border-2', getQualityColor())}>
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getQualityIcon()}
            <span className="font-semibold text-slate-900">Photo Quality: {getQualityText()}</span>
          </div>
          <Badge variant="outline" className={cn('text-sm', getQualityBadgeColor())}>
            {quality.score}/100
          </Badge>
        </div>

        {/* Quality Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              Resolution
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full',
                    quality.metrics.resolution >= 75
                      ? 'bg-green-500'
                      : quality.metrics.resolution >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  )}
                  style={{ width: `${quality.metrics.resolution}%` }}
                />
              </div>
              <span className="text-xs font-medium">{quality.metrics.resolution}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Brightness
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full',
                    quality.metrics.brightness >= 75
                      ? 'bg-green-500'
                      : quality.metrics.brightness >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  )}
                  style={{ width: `${quality.metrics.brightness}%` }}
                />
              </div>
              <span className="text-xs font-medium">{quality.metrics.brightness}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Camera className="h-3 w-3" />
              Sharpness
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full',
                    quality.metrics.sharpness >= 75
                      ? 'bg-green-500'
                      : quality.metrics.sharpness >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  )}
                  style={{ width: `${quality.metrics.sharpness}%` }}
                />
              </div>
              <span className="text-xs font-medium">{quality.metrics.sharpness}%</span>
            </div>
          </div>
        </div>

        {/* Issues & Suggestions */}
        {quality.issues.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50/50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm">
              <div className="font-semibold mb-1">Issues Detected:</div>
              <ul className="list-disc list-inside space-y-1">
                {quality.issues.map((issue, idx) => (
                  <li key={idx} className="text-yellow-700">
                    {issue}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {quality.suggestions.length > 0 && (
          <Alert className="border-blue-200 bg-blue-50/50">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm">
              <div className="font-semibold mb-1">Suggestions:</div>
              <ul className="list-disc list-inside space-y-1">
                {quality.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-blue-700">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
