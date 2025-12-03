import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schema for updating an item
const updateItemSchema = z.object({
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1800).max(2100).optional(),
  referenceNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  vin: z.string().optional(),
  makeModel: z.string().optional(),
  matchingNumbers: z.boolean().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),
  estimatedValue: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'verified', 'flagged', 'rejected']).optional(),
})

// GET /api/items/[id] - Get single item details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = session.user as any

    const item = await prisma.item.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
      include: {
        category: true,
        createdBy: {
          select: {
            fullName: true,
            email: true,
          },
        },
        mediaAssets: {
          orderBy: { uploadedAt: 'desc' },
        },
        provenanceEvents: {
          orderBy: { occurredAt: 'desc' },
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error fetching item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    )
  }
}

// PATCH /api/items/[id] - Update an item
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = session.user as any

    // Verify ownership
    const existingItem = await prisma.item.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateItemSchema.parse(body)

    // Convert string prices to Decimal
    const updateData: any = { ...validatedData }

    if (validatedData.purchaseDate) {
      updateData.purchaseDate = new Date(validatedData.purchaseDate)
    }

    if (validatedData.purchasePrice) {
      updateData.purchasePrice = parseFloat(validatedData.purchasePrice)
    }

    if (validatedData.estimatedValue) {
      updateData.estimatedValue = parseFloat(validatedData.estimatedValue)
    }

    const item = await prisma.item.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
      },
    })

    return NextResponse.json({ item })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating item:', error)
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
}

// DELETE /api/items/[id] - Delete an item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = session.user as any

    // Verify ownership
    const existingItem = await prisma.item.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // Delete item (cascade will handle related records)
    await prisma.item.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}
