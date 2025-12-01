import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateSavedSearchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  filters: z.object({
    search: z.string().optional(),
    categories: z.array(z.string()).optional(),
    statuses: z.array(z.string()).optional(),
    purchaseDateFrom: z.string().optional(),
    purchaseDateTo: z.string().optional(),
    createdAtFrom: z.string().optional(),
    createdAtTo: z.string().optional(),
    minPurchasePrice: z.number().optional(),
    maxPurchasePrice: z.number().optional(),
    minEstimatedValue: z.number().optional(),
    maxEstimatedValue: z.number().optional(),
  }).optional(),
  isDefault: z.boolean().optional(),
})

// GET /api/saved-searches/[id] - Get a specific saved search
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

    const savedSearch = await prisma.savedSearch.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        organizationId: user.organizationId,
      },
    })

    if (!savedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ savedSearch })
  } catch (error) {
    console.error('Error fetching saved search:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved search' },
      { status: 500 }
    )
  }
}

// PATCH /api/saved-searches/[id] - Update a saved search
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

    // Check if saved search exists and belongs to user
    const existingSavedSearch = await prisma.savedSearch.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        organizationId: user.organizationId,
      },
    })

    if (!existingSavedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateSavedSearchSchema.parse(body)

    // If setting as default, unset other defaults for this user
    if (validatedData.isDefault) {
      await prisma.savedSearch.updateMany({
        where: {
          userId: user.id,
          organizationId: user.organizationId,
          isDefault: true,
          NOT: {
            id: params.id,
          },
        },
        data: {
          isDefault: false,
        },
      })
    }

    const savedSearch = await prisma.savedSearch.update({
      where: {
        id: params.id,
      },
      data: validatedData,
    })

    return NextResponse.json({ savedSearch })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating saved search:', error)
    return NextResponse.json(
      { error: 'Failed to update saved search' },
      { status: 500 }
    )
  }
}

// DELETE /api/saved-searches/[id] - Delete a saved search
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

    // Check if saved search exists and belongs to user
    const existingSavedSearch = await prisma.savedSearch.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        organizationId: user.organizationId,
      },
    })

    if (!existingSavedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    await prisma.savedSearch.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json(
      { message: 'Saved search deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting saved search:', error)
    return NextResponse.json(
      { error: 'Failed to delete saved search' },
      { status: 500 }
    )
  }
}
