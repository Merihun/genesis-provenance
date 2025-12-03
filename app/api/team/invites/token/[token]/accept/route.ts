import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const token = params.token;

    // Find the invitation
    const invite = await prisma.teamInvite.findUnique({
      where: { inviteToken: token },
      include: { organization: true },
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is valid
    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: `This invitation has already been ${invite.status}` },
        { status: 400 }
      );
    }

    if (invite.expiresAt < new Date()) {
      // Mark as expired
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: 'expired' },
      });
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // Check if invitation email matches logged-in user
    if (user.email !== invite.email) {
      return NextResponse.json(
        {
          error: 'This invitation was sent to a different email address',
          inviteEmail: invite.email,
          userEmail: user.email,
        },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        organizationId: invite.organizationId,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this organization' },
        { status: 400 }
      );
    }

    // Create team member and update invitation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create team member
      const teamMember = await tx.teamMember.create({
        data: {
          userId: user.id,
          organizationId: invite.organizationId,
          role: invite.role,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Update invitation status
      await tx.teamInvite.update({
        where: { id: invite.id },
        data: { status: 'accepted' },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'team_member_added',
          resource: 'team_member',
          resourceId: teamMember.id,
          details: {
            email: user.email,
            role: invite.role,
            organizationId: invite.organizationId,
            method: 'invitation_accepted',
          },
        },
      });

      return teamMember;
    });

    return NextResponse.json({
      message: 'Successfully joined the organization',
      teamMember: {
        id: result.id,
        role: result.role,
        user: result.user,
        organization: result.organization,
        addedAt: result.addedAt,
      },
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
