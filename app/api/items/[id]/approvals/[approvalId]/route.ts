import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { ApprovalStatus, TeamRole, ItemStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Schema for responding to approval requests
const respondToApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected', 'cancelled']),
  responseNotes: z.string().optional(),
  updateItemStatus: z.boolean().optional().default(false), // If true, update item status based on approval
});

/**
 * PATCH /api/items/[id]/approvals/[approvalId]
 * Respond to an approval request (approve/reject) or cancel it
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; approvalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemId = params.id;
    const approvalId = params.approvalId;
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
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

    // Find the approval request
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        requestedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!approval) {
      return NextResponse.json(
        { error: 'Approval request not found' },
        { status: 404 }
      );
    }

    if (approval.itemId !== itemId) {
      return NextResponse.json(
        { error: 'Approval does not belong to this item' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = respondToApprovalSchema.parse(body);

    // Check if the approval is already processed
    if (approval.status !== 'pending') {
      return NextResponse.json(
        { error: 'This approval request has already been processed' },
        { status: 400 }
      );
    }

    // Verify user has permission to respond to this approval
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: userId,
        organizationId: organizationId,
      },
    });

    const canRespond = canUserRespondToApproval(
      approval,
      userId,
      validatedData.status,
      teamMember?.role,
      userRole
    );

    if (!canRespond) {
      return NextResponse.json(
        { error: 'You do not have permission to respond to this approval request' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: validatedData.status as ApprovalStatus,
      responseNotes: validatedData.responseNotes,
      respondedAt: new Date(),
    };

    // If approving or rejecting (not canceling), set the approver
    if (validatedData.status !== 'cancelled') {
      updateData.approverUserId = userId;
    }

    // Update the approval
    const updatedApproval = await prisma.approval.update({
      where: { id: approvalId },
      data: updateData,
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

    // Optionally update item status based on approval
    if (validatedData.updateItemStatus && validatedData.status === 'approved') {
      let newItemStatus: ItemStatus | undefined;

      // Map approval types to item statuses
      if (approval.approvalType === 'verification' || approval.approvalType === 'authenticity_check') {
        newItemStatus = 'verified';
      }

      if (newItemStatus) {
        await prisma.item.update({
          where: { id: itemId },
          data: { status: newItemStatus },
        });

        // Create provenance event for status change
        await prisma.provenanceEvent.create({
          data: {
            itemId: itemId,
            userId: userId,
            eventType: 'status_changed',
            title: 'Item status updated',
            description: `Status changed to ${newItemStatus} after approval`,
          },
        });
      }
    }

    // Create notification for the requester
    const notificationType =
      validatedData.status === 'approved'
        ? 'approval_approved'
        : validatedData.status === 'rejected'
        ? 'approval_rejected'
        : 'system_alert';

    const notificationMessage =
      validatedData.status === 'approved'
        ? `${session.user?.name || 'Someone'} approved your ${approval.approvalType} request for ${item.brand || 'an item'}`
        : validatedData.status === 'rejected'
        ? `${session.user?.name || 'Someone'} rejected your ${approval.approvalType} request for ${item.brand || 'an item'}`
        : `Your ${approval.approvalType} request for ${item.brand || 'an item'} was cancelled`;

    await prisma.notification.create({
      data: {
        userId: approval.requestedByUserId,
        type: notificationType,
        title: `Approval ${validatedData.status}`,
        message: notificationMessage,
        actionUrl: `/vault/${itemId}?tab=approvals`,
        relatedItemId: itemId,
        relatedApprovalId: approval.id,
        relatedUserId: userId,
      },
    });

    // Create a provenance event
    await prisma.provenanceEvent.create({
      data: {
        itemId: itemId,
        userId: userId,
        eventType: 'reviewed',
        title: `Approval ${validatedData.status}`,
        description: `${approval.approvalType} approval ${validatedData.status} by ${session.user?.name || 'Someone'}`,
      },
    });

    return NextResponse.json({ approval: updatedApproval });
  } catch (error) {
    console.error('Error responding to approval:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to respond to approval request' },
      { status: 500 }
    );
  }
}

// Helper function to check if a user can respond to an approval
function canUserRespondToApproval(
  approval: any,
  userId: string,
  responseStatus: string,
  teamRole: TeamRole | undefined,
  userRole: string
): boolean {
  // Requester can cancel their own request
  if (responseStatus === 'cancelled' && approval.requestedByUserId === userId) {
    return true;
  }

  // User is the requester and trying to approve/reject
  if (approval.requestedByUserId === userId && responseStatus !== 'cancelled') {
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

  // Admin users can respond to anything
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
