import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSavedSearchSchema = z.object({
  name: z.string().min(1).max(100),
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
  }),
  isDefault: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  isShared: z.boolean().default(false),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
})

// GET /api/saved-searches - List all saved searches for the user
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const includeShared = searchParams.get('includeShared') !== 'false'

    // Build where clause
    const where: any = {
      organizationId: user.organizationId,
    }

    // Include both user's own searches and shared org searches
    if (includeShared) {
      where.OR = [
        { userId: user.id },
        { isShared: true },
      ]
    } else {
      where.userId = user.id
    }

    const savedSearches = await prisma.savedSearch.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ savedSearches })
  } catch (error) {
    console.error('Error fetching saved searches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved searches' },
      { status: 500 }
    )
  }
}

// POST /api/saved-searches - Create a new saved search
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
    const validatedData = createSavedSearchSchema.parse(body)

    // If setting as default, unset other defaults for this user
    if (validatedData.isDefault) {
      await prisma.savedSearch.updateMany({
        where: {
          userId: user.id,
          organizationId: user.organizationId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        userId: user.id,
        organizationId: user.organizationId,
        filters: validatedData.filters,
        isDefault: validatedData.isDefault,
        isPinned: validatedData.isPinned,
        isShared: validatedData.isShared,
        icon: validatedData.icon,
        color: validatedData.color,
      },
    })

    return NextResponse.json({ savedSearch }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating saved search:', error)
    return NextResponse.json(
      { error: 'Failed to create saved search' },
      { status: 500 }
    )
  }
}
