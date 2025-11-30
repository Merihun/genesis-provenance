'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  Shield, 
  Edit3, 
  Eye, 
  UserPlus, 
  Mail, 
  X, 
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { formatDistance } from 'date-fns';

interface TeamMember {
  id: string;
  role: string;
  addedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  isExpired?: boolean;
}

export default function TeamPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch team members
      const membersRes = await fetch('/api/team');
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setTeamMembers(membersData.teamMembers || []);
        setUserRole(membersData.userRole || '');
      }
      
      // Fetch invitations
      const invitesRes = await fetch('/api/team/invites');
      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setInvitations(invitesData.invites || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteRole) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setInviting(true);
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send invitation',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Invitation sent!',
        description: `An invitation has been sent to ${inviteEmail}`,
      });

      // Reset form and close dialog
      setInviteEmail('');
      setInviteRole('viewer');
      setInviteDialogOpen(false);
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/team/invites/${inviteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to cancel invitation',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Invitation cancelled',
        description: 'The invitation has been cancelled successfully',
      });
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel invitation',
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return Crown;
      case 'admin':
        return Shield;
      case 'editor':
        return Edit3;
      case 'viewer':
        return Eye;
      default:
        return Eye;
    }
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const canManageTeam = ['owner', 'admin'].includes(userRole);
  const pendingInvites = invitations.filter((inv: any) => inv.status === 'pending' && !inv.isExpired);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your organization's team members and their roles
          </p>
        </div>
        {canManageTeam && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-900 hover:bg-blue-800">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Team Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleInvite}>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your organization. They'll receive an email with instructions.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer - View-only access</SelectItem>
                        <SelectItem value="editor">Editor - Can create and edit assets</SelectItem>
                        <SelectItem value="admin">Admin - Full management access</SelectItem>
                        {userRole === 'owner' && (
                          <SelectItem value="owner">Owner - Full administrative access</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteDialogOpen(false)}
                    disabled={inviting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={inviting}
                    className="bg-blue-900 hover:bg-blue-800"
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Pending Invitations */}
      {canManageTeam && pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Pending Invitations ({pendingInvites.length})
            </CardTitle>
            <CardDescription>
              Invitations that haven't been accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvites.map((invite: any) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-orange-50 border-orange-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-orange-100 p-2">
                      <Mail className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{invite.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {invite.role}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Expires {formatDistance(new Date(invite.expiresAt), new Date(), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will cancel the invitation sent to <strong>{invite.email}</strong>. They will no longer be able to accept this invitation.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancelInvite(invite.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Cancel Invitation
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({teamMembers.length})</CardTitle>
          <CardDescription>
            Current members of your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No team members found</p>
            ) : (
              teamMembers.map((member: any) => {
                const RoleIcon = getRoleIcon(member.role);
                const initials = member.user.fullName
                  .split(' ')
                  .map((n: any) => n[0])
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-900 text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{member.user.fullName}</p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Joined {new Date(member.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      <RoleIcon className="mr-1 h-3 w-3" />
                      {member.role}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            What each role can do in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Crown className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Owner</p>
                <p className="text-sm text-gray-600">
                  Full access to all features including billing, team management, and organization settings
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Admin</p>
                <p className="text-sm text-gray-600">
                  Can manage team members, assets, and organization settings (except billing)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Edit3 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Editor</p>
                <p className="text-sm text-gray-600">
                  Can create, edit, and manage assets and provenance records
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Viewer</p>
                <p className="text-sm text-gray-600">
                  View-only access to assets, reports, and certificates
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
