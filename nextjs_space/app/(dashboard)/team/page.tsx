import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Shield, Eye, Edit3, Crown } from 'lucide-react';

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  // Fetch team members
  const teamMembers = await prisma.teamMember.findMany({
    where: { organizationId: user?.organizationId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          createdAt: true,
        },
      },
    },
    orderBy: { addedAt: 'desc' },
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'editor':
        return <Edit3 className="h-4 w-4" />;
      case 'viewer':
        return <Eye className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'editor':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
          Team Management
        </h1>
        <p className="mt-2 text-gray-600">
          Manage team members and their access levels
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Team Members ({teamMembers.length})
          </CardTitle>
          <CardDescription>
            Users who have access to your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback className="bg-navy-600 text-white">
                      {member.user.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">{member.user.fullName}</p>
                    <p className="text-sm text-gray-500">{member.user.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Joined {new Date(member.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge className={getRoleBadgeClass(member.role)}>
                  <span className="flex items-center gap-1">
                    {getRoleIcon(member.role)}
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Descriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Owner</h3>
              </div>
              <p className="text-sm text-gray-600">
                Full access to all features, including team management and billing
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Admin</h3>
              </div>
              <p className="text-sm text-gray-600">
                Can manage assets, invite members, and configure settings
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Edit3 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Editor</h3>
              </div>
              <p className="text-sm text-gray-600">
                Can create, edit, and manage assets and provenance records
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold">Viewer</h3>
              </div>
              <p className="text-sm text-gray-600">
                Can view assets and provenance records, but cannot make changes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
