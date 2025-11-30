import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const organizationId = user.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      );
    }

    // Fetch all invitations for the organization
    const invites = await prisma.teamInvite.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Mark expired invitations
    const now = new Date();
    const invitesWithStatus = invites.map((invite: any) => ({
      ...invite,
      isExpired: invite.expiresAt < now && invite.status === 'pending',
    }));

    return NextResponse.json({ invites: invitesWithStatus });
  } catch (error) {
    console.error('Error fetching team invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}
