'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { 
  UserPlus, 
  Building2, 
  Mail, 
  Shield, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { formatDistance } from 'date-fns';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
  organization: {
    id: string;
    name: string;
    type: string;
  };
}

export default function AcceptInvitationPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  const token = params?.token as string;

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/team/invites/token/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load invitation');
        return;
      }

      setInvitation(data.invite);
    } catch (err: any) {
      setError(err.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!session) {
      // Redirect to login with return URL
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/team/accept/${token}`)}`);
      return;
    }

    try {
      setAccepting(true);
      const response = await fetch(`/api/team/invites/token/${token}/accept`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to accept invitation',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success!',
        description: `You've joined ${invitation?.organization.name}`,
      });

      // Redirect to team page after a short delay
      setTimeout(() => {
        router.push('/team');
      }, 1500);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setAccepting(false);
    }
  };

  const getRoleDetails = (role: string) => {
    const roles = {
      owner: {
        label: 'Owner',
        description: 'Full administrative access to all features',
        icon: Shield,
        color: 'text-yellow-600',
      },
      admin: {
        label: 'Admin',
        description: 'Manage team members and organization settings',
        icon: Shield,
        color: 'text-blue-600',
      },
      editor: {
        label: 'Editor',
        description: 'Create, edit, and manage assets',
        icon: UserPlus,
        color: 'text-green-600',
      },
      viewer: {
        label: 'Viewer',
        description: 'View-only access to assets and reports',
        icon: UserPlus,
        color: 'text-gray-600',
      },
    };
    return roles[role as keyof typeof roles] || roles.viewer;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-gray-600">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-center">Invitation Not Found</CardTitle>
            <CardDescription className="text-center">
              {error || 'This invitation link is invalid or has expired.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">
                Return to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const roleDetails = getRoleDetails(invitation.role);
  const RoleIcon = roleDetails.icon;
  const expiresIn = formatDistance(new Date(invitation.expiresAt), new Date(), { addSuffix: true });

  // Check if invitation is expired or not pending
  if (invitation.status !== 'pending' || invitation.isExpired) {
    const statusConfig = {
      accepted: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        title: 'Invitation Already Accepted',
        description: 'This invitation has already been accepted.',
      },
      declined: {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        title: 'Invitation Cancelled',
        description: 'This invitation has been cancelled.',
      },
      expired: {
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        title: 'Invitation Expired',
        description: 'This invitation has expired. Please contact the organization administrator.',
      },
    };

    const status = invitation.isExpired ? 'expired' : invitation.status;
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.expired;
    const StatusIcon = config.icon;

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className={`rounded-full ${config.bgColor} p-3`}>
                <StatusIcon className={`h-8 w-8 ${config.color}`} />
              </div>
            </div>
            <CardTitle className="text-center">{config.title}</CardTitle>
            <CardDescription className="text-center">
              {config.description}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">
                Return to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Check if user is logged in with correct email
  const isLoggedIn = status === 'authenticated' && session;
  const emailMatches = session?.user?.email === invitation.email;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center mb-2">
            <div className="rounded-full bg-blue-100 p-4">
              <UserPlus className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">You're Invited!</CardTitle>
            <CardDescription className="text-base mt-2">
              Join your team on Genesis Provenance
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Organization Details */}
          <div className="rounded-lg border bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Organization</p>
                <p className="text-lg font-semibold text-gray-900">{invitation.organization.name}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Invitation Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Invited Email</p>
                <p className="text-base text-gray-900">{invitation.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RoleIcon className={`h-5 w-5 ${roleDetails.color} mt-0.5`} />
              <div>
                <p className="text-sm font-medium text-gray-500">Your Role</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{roleDetails.label}</Badge>
                  <span className="text-sm text-gray-600">{roleDetails.description}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Expires</p>
                <p className="text-base text-gray-900">{expiresIn}</p>
              </div>
            </div>
          </div>

          {/* Email Mismatch Warning */}
          {isLoggedIn && !emailMatches && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation was sent to <strong>{invitation.email}</strong>, but you're logged in as <strong>{session?.user?.email}</strong>. Please sign in with the correct account to accept this invitation.
              </AlertDescription>
            </Alert>
          )}

          {/* Not Logged In Notice */}
          {!isLoggedIn && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to sign in or create an account with <strong>{invitation.email}</strong> to accept this invitation.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {isLoggedIn && emailMatches ? (
            <Button
              onClick={handleAcceptInvitation}
              disabled={accepting}
              className="w-full bg-blue-900 hover:bg-blue-800"
              size="lg"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  Accept Invitation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Link href={`/auth/login?callbackUrl=${encodeURIComponent(`/team/accept/${token}`)}`} className="w-full">
              <Button className="w-full bg-blue-900 hover:bg-blue-800" size="lg">
                Sign In to Accept
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link href="/" className="w-full">
            <Button variant="ghost" className="w-full">
              Maybe Later
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
