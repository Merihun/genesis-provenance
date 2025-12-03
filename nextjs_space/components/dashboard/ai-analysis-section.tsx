'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AIAnalysis {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  confidenceScore: number | null;
  fraudRiskLevel: 'low' | 'medium' | 'high' | 'critical' | null;
  findings: {
    summary: string;
    overallAssessment: string;
    keyObservations: string[];
  } | null;
  counterfeitIndicators: {
    found: boolean;
    items: Array<{
      indicator: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
  } | null;
  authenticityMarkers: {
    found: boolean;
    items: Array<{
      marker: string;
      confidence: 'low' | 'medium' | 'high';
      description: string;
    }>;
  } | null;
  processingTime: number | null;
  apiProvider: string | null;
  requestedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  requestedBy: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface AIAnalysisSectionProps {
  itemId: string;
  itemName: string;
  categorySlug: string;
}

export function AIAnalysisSection({
  itemId,
  itemName,
  categorySlug,
}: AIAnalysisSectionProps) {
  const { data: session } = useSession() || {};
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [expandedAnalyses, setExpandedAnalyses] = useState<Set<string>>(new Set());

  // Fetch analyses
  const fetchAnalyses = async () => {
    try {
      const response = await fetch(`/api/items/${itemId}/ai-analysis`);
      if (!response.ok) throw new Error('Failed to fetch analyses');
      const data = await response.json();
      setAnalyses(data.analyses || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI analyses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [itemId]);

  // Poll for updates if there's a pending/processing analysis
  useEffect(() => {
    const hasPendingAnalysis = analyses.some(
      a => a.status === 'pending' || a.status === 'processing'
    );

    if (!hasPendingAnalysis) return;

    const interval = setInterval(fetchAnalyses, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [analyses]);

  // Request new analysis
  const handleRequestAnalysis = async () => {
    setRequesting(true);
    try {
      const response = await fetch(`/api/items/${itemId}/ai-analysis`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to request analysis');
      }

      toast({
        title: 'Analysis Requested',
        description: 'AI authentication analysis is now in progress',
      });

      // Refresh analyses
      await fetchAnalyses();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to request analysis',
        variant: 'destructive',
      });
    } finally {
      setRequesting(false);
    }
  };

  const toggleAnalysisExpanded = (id: string) => {
    setExpandedAnalyses(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const latestAnalysis = analyses[0];

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">AI Authentication</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Advanced computer vision analysis for authenticity verification
            </p>
          </div>
          <Button
            onClick={handleRequestAnalysis}
            disabled={requesting || analyses.some(a => a.status === 'pending' || a.status === 'processing')}
            size="sm"
          >
            {requesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Request Analysis
              </>
            )}
          </Button>
        </div>

        {/* Educational Info Toggle */}
        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEducation(!showEducation)}
            className="text-sm"
          >
            <Info className="mr-2 h-4 w-4" />
            What does AI authentication check?
            {showEducation ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>

          {showEducation && (
            <div className="mt-4 rounded-lg bg-muted p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Our AI authentication system uses advanced computer vision and machine learning
                to analyze multiple aspects of your luxury asset. While AI provides rapid initial
                assessment, we always recommend expert verification for high-value items.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Analysis includes:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• High-resolution image analysis</li>
                  <li>• Material texture and finish inspection</li>
                  <li>• Manufacturing mark verification</li>
                  <li>• Wear pattern consistency analysis</li>
                  <li>• Category-specific authenticity checks</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Analysis Results */}
      {analyses.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No AI analyses have been requested yet. Click "Request Analysis" above to start
            an authenticity check.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {analyses.map(analysis => (
            <AnalysisCard
              key={analysis.id}
              analysis={analysis}
              isLatest={analysis.id === latestAnalysis?.id}
              isExpanded={expandedAnalyses.has(analysis.id)}
              onToggleExpand={() => toggleAnalysisExpanded(analysis.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AnalysisCard({
  analysis,
  isLatest,
  isExpanded,
  onToggleExpand,
}: {
  analysis: AIAnalysis;
  isLatest: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const getStatusConfig = (status: AIAnalysis['status']) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        };
      case 'processing':
        return {
          icon: Loader2,
          label: 'Processing',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          animated: true,
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: 'Completed',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'failed':
        return {
          icon: XCircle,
          label: 'Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
    }
  };

  const getRiskConfig = (risk: AIAnalysis['fraudRiskLevel']) => {
    if (!risk) return null;
    switch (risk) {
      case 'low':
        return {
          label: 'Low Risk',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: Shield,
        };
      case 'medium':
        return {
          label: 'Medium Risk',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          icon: AlertCircle,
        };
      case 'high':
        return {
          label: 'High Risk',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          icon: AlertTriangle,
        };
      case 'critical':
        return {
          label: 'Critical Risk',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: AlertTriangle,
        };
    }
  };

  const statusConfig = getStatusConfig(analysis.status);
  const riskConfig = analysis.fraudRiskLevel ? getRiskConfig(analysis.fraudRiskLevel) : null;
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={cn('overflow-hidden', isLatest && 'border-2 border-blue-200')}>
      {/* Header */}
      <div className="p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', statusConfig.bgColor)}>
              <StatusIcon
                className={cn(
                  'h-5 w-5',
                  statusConfig.color,
                  statusConfig.animated && 'animate-spin'
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{statusConfig.label}</p>
                {isLatest && <Badge variant="secondary">Latest</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                Requested {formatDistanceToNow(new Date(analysis.requestedAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          {analysis.status === 'completed' && (
            <Button variant="ghost" size="sm" onClick={onToggleExpand}>
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show Details
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {analysis.status === 'completed' && analysis.findings && (
        <div className="p-6 space-y-6">
          {/* Confidence Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Confidence Score</p>
                <p className="text-2xl font-bold">{analysis.confidenceScore}%</p>
              </div>
              {riskConfig && (
                <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', riskConfig.bgColor)}>
                  <riskConfig.icon className={cn('h-5 w-5', riskConfig.color)} />
                  <span className={cn('font-medium', riskConfig.color)}>{riskConfig.label}</span>
                </div>
              )}
            </div>
            <Progress value={analysis.confidenceScore || 0} className="h-2" />
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <h4 className="font-medium">Analysis Summary</h4>
            <p className="text-sm text-muted-foreground">{analysis.findings.summary}</p>
          </div>

          {isExpanded && (
            <>
              <Separator />

              {/* Overall Assessment */}
              <div className="space-y-2">
                <h4 className="font-medium">Overall Assessment</h4>
                <p className="text-sm text-muted-foreground">
                  {analysis.findings.overallAssessment}
                </p>
              </div>

              {/* Key Observations */}
              {analysis.findings.keyObservations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Key Observations</h4>
                  <ul className="space-y-1">
                    {analysis.findings.keyObservations.map((obs, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Counterfeit Indicators */}
              {analysis.counterfeitIndicators && analysis.counterfeitIndicators.found && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <h4 className="font-medium">Areas Requiring Attention</h4>
                    </div>
                    <div className="space-y-3">
                      {analysis.counterfeitIndicators.items.map((indicator, idx) => (
                        <div key={idx} className="border rounded-lg p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{indicator.indicator}</p>
                            <Badge
                              variant={indicator.severity === 'high' ? 'destructive' : 'secondary'}
                            >
                              {indicator.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{indicator.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Authenticity Markers */}
              {analysis.authenticityMarkers && analysis.authenticityMarkers.found && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <h4 className="font-medium">Authenticity Markers</h4>
                    </div>
                    <div className="space-y-3">
                      {analysis.authenticityMarkers.items.map((marker, idx) => (
                        <div key={idx} className="border rounded-lg p-3 space-y-1 bg-green-50/50">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{marker.marker}</p>
                            <Badge variant="outline" className="bg-white">
                              {marker.confidence} confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{marker.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Metadata */}
              <Separator />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  Processing time: {analysis.processingTime ? `${(analysis.processingTime / 1000).toFixed(1)}s` : 'N/A'}
                </div>
                <div>
                  Provider: {analysis.apiProvider || 'Unknown'}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Failed State */}
      {analysis.status === 'failed' && (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {analysis.errorMessage || 'Analysis failed. Please try again.'}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Processing/Pending State */}
      {(analysis.status === 'pending' || analysis.status === 'processing') && (
        <div className="p-6">
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              {analysis.status === 'pending'
                ? 'Analysis request is queued and will begin shortly...'
                : 'AI is currently analyzing your asset. This may take 1-3 minutes...'}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </Card>
  );
}
