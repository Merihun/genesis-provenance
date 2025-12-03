import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Retrieve invitation details by token (for acceptance page)
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    const invite = await prisma.teamInvite.findUnique({
      where: { inviteToken: token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const isExpired = invite.expiresAt < now;

    return NextResponse.json({
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: isExpired && invite.status === 'pending' ? 'expired' : invite.status,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        organization: invite.organization,
        isExpired,
      },
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}
