'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
      </div>
    );
  }

  const user = session?.user as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Implement password change API in Phase 2
    toast({
      title: 'Coming Soon',
      description: 'Password change functionality will be available in a future update.',
    });

    setIsLoading(false);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
          Settings
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Your account details and organization information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Full Name</Label>
              <div className="mt-2 text-gray-900">{user?.name ?? 'N/A'}</div>
            </div>
            <div>
              <Label>Email</Label>
              <div className="mt-2 text-gray-900">{user?.email ?? 'N/A'}</div>
            </div>
            <div>
              <Label>Role</Label>
              <div className="mt-2 text-gray-900 capitalize">{user?.role ?? 'N/A'}</div>
            </div>
            <div>
              <Label>Organization</Label>
              <div className="mt-2 text-gray-900">{user?.organizationName ?? 'Individual'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="mt-2"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="mt-2"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="mt-2"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="bg-blue-900 hover:bg-blue-800"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Organization Settings (for reseller/partner only) */}
      {(user?.role === 'reseller' || user?.role === 'partner') && (
        <Card>
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
            <CardDescription>
              Manage your organization details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Organization Name</Label>
              <div className="mt-2 text-gray-900">{user?.organizationName ?? 'N/A'}</div>
              <p className="mt-2 text-sm text-gray-500">
                Contact support to update your organization settings
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
