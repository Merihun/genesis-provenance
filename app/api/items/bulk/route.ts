import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { ItemStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const bulkUpdateSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1).max(50), // Limit to 50 items per operation
  action: z.enum(['update_status', 'delete']),
  status: z.nativeEnum(ItemStatus).optional(),
})

// POST /api/items/bulk - Perform bulk operations on multiple items
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = session.user as any

    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = bulkUpdateSchema.parse(body)

    // Verify all items belong to the user's organization
    const items = await prisma.item.findMany({
      where: {
        id: { in: validatedData.itemIds },
        organizationId: user.organizationId,
      },
      select: { id: true },
    })

    if (items.length !== validatedData.itemIds.length) {
      return NextResponse.json(
        { error: 'Some items not found or you do not have permission to modify them' },
        { status: 403 }
      )
    }

    let result: any

    switch (validatedData.action) {
      case 'update_status':
        if (!validatedData.status) {
          return NextResponse.json(
            { error: 'Status is required for update_status action' },
            { status: 400 }
          )
        }

        result = await prisma.item.updateMany({
          where: {
            id: { in: validatedData.itemIds },
            organizationId: user.organizationId,
          },
          data: {
            status: validatedData.status,
          },
        })

        // Create provenance events for each item
        await prisma.provenanceEvent.createMany({
          data: validatedData.itemIds.map((itemId) => ({
            itemId,
            userId: user.id,
            eventType: 'reviewed',
            title: 'Bulk Status Update',
            description: `Status changed to ${validatedData.status} via bulk operation`,
            occurredAt: new Date(),
          })),
        })

        return NextResponse.json({
          message: `Successfully updated ${result.count} items`,
          count: result.count,
        })

      case 'delete':
        // Prisma will handle cascade deletes for related records
        result = await prisma.item.deleteMany({
          where: {
            id: { in: validatedData.itemIds },
            organizationId: user.organizationId,
          },
        })

        return NextResponse.json({
          message: `Successfully deleted ${result.count} items`,
          count: result.count,
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}
