import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { sendTeamInvitation } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'admin', 'editor', 'viewer'], {
    errorMap: () => ({ message: 'Role must be owner, admin, editor, or viewer' }),
  }),
});

export async function POST(request: NextRequest) {
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

    // Check if user has permission to invite (only owner and admin)
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        organizationId,
      },
    });

    if (!teamMember || !['owner', 'admin'].includes(teamMember.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can invite team members.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = inviteSchema.parse(body);

    // Check if user already exists in this organization
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          userId: existingUser.id,
          organizationId,
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: 'This user is already a member of your organization' },
          { status: 400 }
        );
      }
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        email: validatedData.email,
        organizationId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
;
    }

    // Generate unique invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Create invitation
    const invite = await prisma.teamInvite.create({
      data: {
        organizationId,
        email: validatedData.email,
        role: validatedData.role,
        inviteToken,
        status: 'pending',
        expiresAt,
      },
      include: {
        organization: true,
      },
    });

    // Send invitation email
    const emailResult = await sendTeamInvitation({
      to: validatedData.email,
      inviterName: user.name || 'A team member',
      inviterEmail: user.email || '',
      organizationName: invite.organization.name,
      role: validatedData.role,
      inviteToken,
      expiresAt,
    });

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      // Still return success since the invitation was created
      return NextResponse.json({
        message: 'Invitation created but email failed to send. Please check email configuration.',
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          status: invite.status,
          expiresAt: invite.expiresAt,
          createdAt: invite.createdAt,
        },
        emailError: emailResult.error,
      });
    }

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error inviting team member:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
