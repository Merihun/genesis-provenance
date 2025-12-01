import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for creating/editing comments
const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000, 'Comment is too long'),
  mentionedUserIds: z.array(z.string()).optional().default([]),
  parentCommentId: z.string().optional(),
});

/**
 * GET /api/items/[id]/comments
 * Retrieve all comments for a specific item
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

    // Fetch all comments for this item (only top-level, with replies nested)
    const comments = await prisma.comment.findMany({
      where: {
        itemId: itemId,
        parentCommentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/items/[id]/comments
 * Create a new comment on an item
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
    const validatedData = createCommentSchema.parse(body);

    // Verify all mentioned users exist and are in the same organization
    if (validatedData.mentionedUserIds && validatedData.mentionedUserIds.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: {
          id: { in: validatedData.mentionedUserIds },
          organizationId: organizationId,
        },
      });

      if (mentionedUsers.length !== validatedData.mentionedUserIds.length) {
        return NextResponse.json(
          { error: 'Some mentioned users are not in your organization' },
          { status: 400 }
        );
      }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        itemId: itemId,
        userId: userId,
        content: validatedData.content,
        mentionedUserIds: validatedData.mentionedUserIds || [],
        parentCommentId: validatedData.parentCommentId,
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

    // Create notifications for mentioned users
    if (validatedData.mentionedUserIds && validatedData.mentionedUserIds.length > 0) {
      const notifications = validatedData.mentionedUserIds
        .filter((mentionedId) => mentionedId !== userId) // Don't notify yourself
        .map((mentionedId) => ({
          userId: mentionedId,
          type: 'comment_mention' as const,
          title: 'You were mentioned in a comment',
          message: `${session.user?.name || 'Someone'} mentioned you in a comment on ${item.brand || 'an item'}`,
          actionUrl: `/vault/${itemId}?tab=comments`,
          relatedItemId: itemId,
          relatedCommentId: comment.id,
          relatedUserId: userId,
        }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        });
      }
    }

    // If this is a reply, notify the parent comment author
    if (validatedData.parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentCommentId },
      });

      if (parentComment && parentComment.userId !== userId) {
        await prisma.notification.create({
          data: {
            userId: parentComment.userId,
            type: 'comment_reply',
            title: 'New reply to your comment',
            message: `${session.user?.name || 'Someone'} replied to your comment on ${item.brand || 'an item'}`,
            actionUrl: `/vault/${itemId}?tab=comments`,
            relatedItemId: itemId,
            relatedCommentId: comment.id,
            relatedUserId: userId,
          },
        });
      }
    }

    // Create a provenance event
    await prisma.provenanceEvent.create({
      data: {
        itemId: itemId,
        userId: userId,
        eventType: 'note_added',
        title: 'Comment added',
        description: `Comment added by ${session.user?.name || 'Someone'}`,
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
