import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// DELETE - Cancel/revoke an invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const organizationId = user.organizationId;
    const inviteId = params.id;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      );
    }

    // Check if user has permission (only owner and admin)
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        organizationId,
      },
    });

    if (!teamMember || !['owner', 'admin'].includes(teamMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Find the invitation
    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Verify invitation belongs to user's organization
    if (invite.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Invitation does not belong to your organization' },
        { status: 403 }
      );
    }

    // Update invitation status to declined (soft delete)
    await prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: 'declined' },
    });

    return NextResponse.json({
      message: 'Invitation cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { error: 'Failed to cancel invitation' },
      { status: 500 }
    );
  }
}
