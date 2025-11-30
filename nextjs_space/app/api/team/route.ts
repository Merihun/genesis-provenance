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

    // Get user's role
    const currentMember = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        organizationId,
      },
    });

    // Fetch all team members
    const teamMembers = await prisma.teamMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    return NextResponse.json({
      teamMembers,
      userRole: currentMember?.role || 'viewer',
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
