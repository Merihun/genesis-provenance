import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for editing comments
const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000, 'Comment is too long'),
});

/**
 * PATCH /api/items/[id]/comments/[commentId]
 * Edit an existing comment
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemId = params.id;
    const commentId = params.commentId;
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

    // Find the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Verify the user is the comment author
    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = updateCommentSchema.parse(body);

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: validatedData.content,
        isEdited: true,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    console.error('Error updating comment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/items/[id]/comments/[commentId]
 * Delete a comment (only by author or admin)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemId = params.id;
    const commentId = params.commentId;
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

    // Find the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Get user's team role in the organization
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: userId,
        organizationId: organizationId,
      },
    });

    const teamRole = teamMember?.role;
    const isAdmin = userRole === 'admin' || teamRole === 'owner' || teamRole === 'admin';

    // Verify the user is the comment author or an admin
    if (comment.userId !== userId && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only delete your own comments or must be an admin' },
        { status: 403 }
      );
    }

    // Delete the comment (cascade will delete replies and notifications)
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json(
      { message: 'Comment deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
