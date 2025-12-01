import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { TeamRole, ApprovalPriority } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Schema for creating approval requests
const createApprovalSchema = z.object({
  approvalType: z.string().min(1, 'Approval type is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  requestNotes: z.string().optional(),
  requiredRole: z.enum(['owner', 'admin', 'editor', 'viewer']).optional(),
  approverUserId: z.string().optional(),
  dueDate: z.string().optional(), // ISO date string
});

/**
 * GET /api/items/[id]/approvals
 * Retrieve all approval requests for a specific item
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemId = params.id;
    const userId = (session.user as any).id;
    const organizationId = (session.user as any).organizationId;

    // Verify user has access to this item
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        organizationId: organizationId,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch all approval requests for this item
    const approvals = await prisma.approval.findMany({
      where: {
        itemId: itemId,
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });

    // Get user's team role to determine which approvals they can act on
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: userId,
        organizationId: organizationId,
      },
    });

    const enhancedApprovals = approvals.map((approval: any) => ({
      ...approval,
      canApprove: canUserApprove(approval, userId, teamMember?.role, (session.user as any).role),
    }));

    return NextResponse.json({ approvals: enhancedApprovals });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/items/[id]/approvals
 * Create a new approval request
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemId = params.id;
    const userId = (session.user as any).id;
    const organizationId = (session.user as any).organizationId;

    // Verify user has access to this item
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        organizationId: organizationId,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found or access denied' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = createApprovalSchema.parse(body);

    // Verify approver exists if specified
    if (validatedData.approverUserId) {
      const approver = await prisma.user.findFirst({
        where: {
          id: validatedData.approverUserId,
          organizationId: organizationId,
        },
      });

      if (!approver) {
        return NextResponse.json(
          { error: 'Specified approver not found in your organization' },
          { status: 400 }
        );
      }
    }

    // Create the approval request
    const approval = await prisma.approval.create({
      data: {
        itemId: itemId,
        requestedByUserId: userId,
        approverUserId: validatedData.approverUserId,
        approvalType: validatedData.approvalType,
        priority: validatedData.priority as ApprovalPriority,
        requestNotes: validatedData.requestNotes,
        requiredRole: validatedData.requiredRole as TeamRole | undefined,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Create notification for the approver or all eligible approvers
    if (validatedData.approverUserId) {
      // Notify specific approver
      await prisma.notification.create({
        data: {
          userId: validatedData.approverUserId,
          type: 'approval_requested',
          title: 'New approval request',
          message: `${session.user?.name || 'Someone'} requested ${validatedData.approvalType} approval for ${item.brand || 'an item'}`,
          actionUrl: `/vault/${itemId}?tab=approvals`,
          relatedItemId: itemId,
          relatedApprovalId: approval.id,
          relatedUserId: userId,
        },
      });
    } else if (validatedData.requiredRole) {
      // Notify all team members with the required role or higher
      const eligibleMembers = await prisma.teamMember.findMany({
        where: {
          organizationId: organizationId,
          role: { in: getRolesAtOrAbove(validatedData.requiredRole as TeamRole) },
          userId: { not: userId }, // Don't notify the requester
        },
      });

      const notifications = eligibleMembers.map((member) => ({
        userId: member.userId,
        type: 'approval_requested' as const,
        title: 'New approval request',
        message: `${session.user?.name || 'Someone'} requested ${validatedData.approvalType} approval for ${item.brand || 'an item'}`,
        actionUrl: `/vault/${itemId}?tab=approvals`,
        relatedItemId: itemId,
        relatedApprovalId: approval.id,
        relatedUserId: userId,
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        });
      }
    }

    // Create a provenance event
    await prisma.provenanceEvent.create({
      data: {
        itemId: itemId,
        userId: userId,
        eventType: 'note_added',
        title: 'Approval requested',
        description: `${validatedData.approvalType} approval requested by ${session.user?.name || 'Someone'}`,
      },
    });

    return NextResponse.json({ approval }, { status: 201 });
  } catch (error) {
    console.error('Error creating approval:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create approval request' },
      { status: 500 }
    );
  }
}

// Helper function to check if a user can approve a specific approval request
function canUserApprove(
  approval: any,
  userId: string,
  teamRole: TeamRole | undefined,
  userRole: string
): boolean {
  // User is the requester
  if (approval.requestedByUserId === userId) {
    return false;
  }

  // Approval already processed
  if (approval.status !== 'pending') {
    return false;
  }

  // Specific approver assigned
  if (approval.approverUserId) {
    return approval.approverUserId === userId;
  }

  // Check role requirements
  if (approval.requiredRole && teamRole) {
    const requiredRoles = getRolesAtOrAbove(approval.requiredRole);
    return requiredRoles.includes(teamRole);
  }

  // Admin users can approve anything
  if (userRole === 'admin' || teamRole === 'owner' || teamRole === 'admin') {
    return true;
  }

  return false;
}

// Helper function to get all roles at or above a certain level
function getRolesAtOrAbove(role: TeamRole): TeamRole[] {
  const roleHierarchy: TeamRole[] = ['owner', 'admin', 'editor', 'viewer'];
  const roleIndex = roleHierarchy.indexOf(role);
  return roleHierarchy.slice(0, roleIndex + 1);
}
