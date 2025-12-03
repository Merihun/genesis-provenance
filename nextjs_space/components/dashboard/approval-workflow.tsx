'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Plus,
  User,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface Approval {
  id: string;
  approvalType: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestNotes: string | null;
  responseNotes: string | null;
  requiredRole: string | null;
  requestedAt: string;
  respondedAt: string | null;
  dueDate: string | null;
  requestedBy: User;
  approver: User | null;
  canApprove: boolean;
}

interface ApprovalWorkflowProps {
  itemId: string;
}

const APPROVAL_TYPES = [
  { value: 'verification', label: 'Asset Verification' },
  { value: 'authenticity_check', label: 'Authenticity Check' },
  { value: 'value_assessment', label: 'Value Assessment' },
  { value: 'condition_review', label: 'Condition Review' },
  { value: 'ownership_transfer', label: 'Ownership Transfer' },
  { value: 'documentation', label: 'Documentation Review' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

export function ApprovalWorkflow({ itemId }: ApprovalWorkflowProps) {
  const { data: session } = useSession() || {};
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);

  // New approval form
  const [approvalType, setApprovalType] = useState('verification');
  const [priority, setPriority] = useState('medium');
  const [requestNotes, setRequestNotes] = useState('');
  const [requiredRole, setRequiredRole] = useState<string>('');
  const [approverUserId, setApproverUserId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');

  // Response form
  const [responseStatus, setResponseStatus] = useState<'approved' | 'rejected'>('approved');
  const [responseNotes, setResponseNotes] = useState('');
  const [updateItemStatus, setUpdateItemStatus] = useState(true);

  useEffect(() => {
    fetchApprovals();
    fetchTeamMembers();
  }, [itemId]);

  const fetchApprovals = async () => {
    try {
      const res = await fetch(`/api/items/${itemId}/approvals`);
      const data = await res.json();
      if (res.ok) {
        setApprovals(data.approvals || []);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch approvals',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (res.ok && data.teamMembers) {
        setTeamMembers(data.teamMembers.map((tm: any) => tm.user));
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleRequestApproval = async () => {
    if (!approvalType) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/items/${itemId}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalType,
          priority,
          requestNotes: requestNotes || undefined,
          requiredRole: requiredRole || undefined,
          approverUserId: approverUserId || undefined,
          dueDate: dueDate || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Approval request created successfully',
        });
        setDialogOpen(false);
        resetForm();
        fetchApprovals();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create approval request',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create approval request',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondToApproval = async () => {
    if (!selectedApproval) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/items/${itemId}/approvals/${selectedApproval.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: responseStatus,
          responseNotes: responseNotes || undefined,
          updateItemStatus,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Success',
          description: `Approval ${responseStatus} successfully`,
        });
        setRespondDialogOpen(false);
        setSelectedApproval(null);
        setResponseNotes('');
        fetchApprovals();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to respond to approval',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to respond to approval',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelApproval = async (approvalId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/items/${itemId}/approvals/${approvalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Approval request cancelled',
        });
        fetchApprovals();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to cancel approval',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel approval',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setApprovalType('verification');
    setPriority('medium');
    setRequestNotes('');
    setRequiredRole('');
    setApproverUserId('');
    setDueDate('');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { icon: CheckCircle2, color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' },
      cancelled: { icon: AlertCircle, color: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={cn(config.color, 'flex items-center gap-1')}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = PRIORITY_OPTIONS.find((p) => p.value === priority) || PRIORITY_OPTIONS[1];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const completedApprovals = approvals.filter((a) => a.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Request Approval Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Approval Workflows</h3>
          <p className="text-sm text-gray-600">Request and manage approval processes for this asset</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Request Approval
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request Approval</DialogTitle>
              <DialogDescription>
                Create a new approval request for this asset. Specify the type, priority, and who should approve it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="approvalType">Approval Type *</Label>
                <Select value={approvalType} onValueChange={setApprovalType}>
                  <SelectTrigger id="approvalType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date (optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approver">Specific Approver (optional)</Label>
                <Select value={approverUserId} onValueChange={setApproverUserId}>
                  <SelectTrigger id="approver">
                    <SelectValue placeholder="Anyone with required role can approve" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers
                      .filter((member) => member.id !== (session?.user as any)?.id)
                      .map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.fullName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredRole">Required Role (optional)</Label>
                <Select value={requiredRole} onValueChange={setRequiredRole}>
                  <SelectTrigger id="requiredRole">
                    <SelectValue placeholder="Any team member can approve" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label} or higher
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestNotes">Request Notes (optional)</Label>
                <Textarea
                  id="requestNotes"
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  className="min-h-[100px]"
                  placeholder="Provide additional context or instructions for the approver..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRequestApproval} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">Pending Approvals ({pendingApprovals.length})</h4>
          {pendingApprovals.map((approval) => (
            <Card key={approval.id} className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-semibold">
                        {APPROVAL_TYPES.find((t) => t.value === approval.approvalType)?.label || approval.approvalType}
                      </h5>
                      {getStatusBadge(approval.status)}
                      {getPriorityBadge(approval.priority)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="mr-1 h-3 w-3" />
                        Requested by {approval.requestedBy.fullName}
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatDistanceToNow(new Date(approval.requestedAt), { addSuffix: true })}
                      </div>
                      {approval.dueDate && (
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          Due {formatDistanceToNow(new Date(approval.dueDate), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                    {approval.requestNotes && (
                      <p className="text-sm text-gray-700 mt-2">{approval.requestNotes}</p>
                    )}
                    {approval.requiredRole && (
                      <p className="text-xs text-gray-500">
                        Requires: {approval.requiredRole} role or higher
                      </p>
                    )}
                    {approval.approver && (
                      <p className="text-xs text-gray-500">
                        Assigned to: {approval.approver.fullName}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {approval.canApprove && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedApproval(approval);
                          setResponseStatus('approved');
                          setRespondDialogOpen(true);
                        }}
                      >
                        Respond
                      </Button>
                    )}
                    {approval.requestedBy.id === (session?.user as any)?.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelApproval(approval.id)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed Approvals */}
      {completedApprovals.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">Approval History ({completedApprovals.length})</h4>
          {completedApprovals.map((approval) => (
            <Card key={approval.id} className="opacity-75">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-semibold">
                        {APPROVAL_TYPES.find((t) => t.value === approval.approvalType)?.label || approval.approvalType}
                      </h5>
                      {getStatusBadge(approval.status)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div>Requested by {approval.requestedBy.fullName}</div>
                      {approval.approver && <div>Responded by {approval.approver.fullName}</div>}
                      {approval.respondedAt && (
                        <div>{formatDistanceToNow(new Date(approval.respondedAt), { addSuffix: true })}</div>
                      )}
                    </div>
                    {approval.responseNotes && (
                      <p className="text-sm text-gray-700 mt-2 italic">Response: {approval.responseNotes}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {approvals.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-600">No approval requests yet</p>
            <p className="text-sm text-gray-500">Create an approval request to get started</p>
          </CardContent>
        </Card>
      )}

      {/* Respond Dialog */}
      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Approval Request</DialogTitle>
            <DialogDescription>
              {selectedApproval &&
                `${APPROVAL_TYPES.find((t) => t.value === selectedApproval.approvalType)?.label || selectedApproval.approvalType} approval requested by ${selectedApproval.requestedBy.fullName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedApproval?.requestNotes && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium mb-1">Request Notes:</p>
                <p className="text-sm text-gray-700">{selectedApproval.requestNotes}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="responseStatus">Decision *</Label>
              <Select
                value={responseStatus}
                onValueChange={(val) => setResponseStatus(val as 'approved' | 'rejected')}
              >
                <SelectTrigger id="responseStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approve</SelectItem>
                  <SelectItem value="rejected">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedApproval?.approvalType === 'verification' && responseStatus === 'approved' && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="updateItemStatus"
                  checked={updateItemStatus}
                  onChange={(e) => setUpdateItemStatus(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="updateItemStatus" className="text-sm">
                  Mark item as verified
                </Label>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="responseNotes">Response Notes (optional)</Label>
              <Textarea
                id="responseNotes"
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                className="min-h-[100px]"
                placeholder="Provide feedback or reasoning for your decision..."
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setRespondDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRespondToApproval}
                disabled={submitting}
                className={responseStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {responseStatus === 'approved' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
