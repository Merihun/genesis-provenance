'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Shield, AlertTriangle, CheckCircle, XCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface AIAnalysis {
  id: string;
  status: string;
  confidenceScore: number | null;
  fraudRiskLevel: string | null;
  requestedAt: string;
  completedAt: string | null;
  item: {
    id: string;
    brand: string | null;
    model: string | null;
    makeModel: string | null;
    category: {
      name: string;
      slug: string;
    };
    organization: {
      id: string;
      name: string;
    };
  };
  requestedBy: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface Stats {
  byStatus: Record<string, number>;
  byFraudRisk: Record<string, number>;
}

export default function AIAnalysesAdminPage() {
  const { data: session, status: sessionStatus } = useSession() || {};
  const router = useRouter();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [stats, setStats] = useState<Stats>({ byStatus: {}, byFraudRisk: {} });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fraudRiskFilter, setFraudRiskFilter] = useState<string>('all');

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session && (session.user as any)?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, sessionStatus, router]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (fraudRiskFilter !== 'all') params.append('fraudRiskLevel', fraudRiskFilter);

      const response = await fetch(`/api/admin/ai-analyses?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch analyses');

      const data = await response.json();
      setAnalyses(data.analyses);
      setStats(data.stats);
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
    if (session && (session.user as any)?.role === 'admin') {
      fetchAnalyses();
    }
  }, [session, statusFilter, fraudRiskFilter]);

  // Auto-refresh for pending/processing analyses
  useEffect(() => {
    const hasPendingAnalysis = analyses.some(
      a => a.status === 'pending' || a.status === 'processing'
    );

    if (!hasPendingAnalysis) return;

    const interval = setInterval(fetchAnalyses, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [analyses]);

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: 'Pending', variant: 'outline', icon: Clock },
      processing: { label: 'Processing', variant: 'outline', icon: Loader2 },
      completed: { label: 'Completed', variant: 'default', icon: CheckCircle },
      failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className={cn('h-3 w-3', status === 'processing' && 'animate-spin')} />
        {config.label}
      </Badge>
    );
  };

  const getFraudRiskBadge = (risk: string | null) => {
    if (!risk) return <Badge variant="outline">N/A</Badge>;

    const configs: Record<string, { label: string; className: string; icon: any }> = {
      low: { label: 'Low Risk', className: 'bg-green-50 text-green-700 border-green-200', icon: Shield },
      medium: { label: 'Medium Risk', className: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: AlertTriangle },
      high: { label: 'High Risk', className: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertTriangle },
      critical: { label: 'Critical Risk', className: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
    };

    const config = configs[risk] || configs.low;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={cn('flex items-center gap-1 w-fit', config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (sessionStatus === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if ((session.user as any)?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Analysis Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage AI authentication analyses across all organizations
          </p>
        </div>
        <Button onClick={fetchAnalyses} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(stats.byStatus).reduce((a, b) => a + b, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending/Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.byStatus.pending || 0) + (stats.byStatus.processing || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.byStatus.completed || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High/Critical Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(stats.byFraudRisk.high || 0) + (stats.byFraudRisk.critical || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter analyses by status and fraud risk level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Fraud Risk Level</label>
              <Select value={fraudRiskFilter} onValueChange={setFraudRiskFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All risk levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="critical">Critical Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analyses Table */}
      <Card>
        <CardHeader>
          <CardTitle>AI Analyses</CardTitle>
          <CardDescription>Recent AI authentication analyses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No analyses found matching the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyses.map((analysis: AIAnalysis) => {
                    const itemName = `${analysis.item.brand || ''} ${analysis.item.model || analysis.item.makeModel || ''}`.trim() || 'Unnamed Item';
                    return (
                      <TableRow key={analysis.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{itemName}</div>
                            <div className="text-sm text-muted-foreground">
                              {analysis.item.category.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{analysis.item.organization.name}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(analysis.status)}</TableCell>
                        <TableCell>
                          {analysis.confidenceScore !== null ? (
                            <div className="font-medium">{analysis.confidenceScore}%</div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{getFraudRiskBadge(analysis.fraudRiskLevel)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDistanceToNow(new Date(analysis.requestedAt), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{analysis.requestedBy.fullName}</div>
                            <div className="text-muted-foreground text-xs">{analysis.requestedBy.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/vault/${analysis.item.id}?tab=ai-auth`} target="_blank">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
