import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { downloadFile } from '@/lib/s3'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schema for creating an item
const createItemSchema = z.object({
  categoryId: z.string().uuid(),
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
})

// GET /api/items - List all items with optional filtering
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

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const status = searchParams.get('status')
    const searchQuery = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {
      organizationId: user.organizationId,
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (status) {
      where.status = status
    }

    if (searchQuery) {
      where.OR = [
        { brand: { contains: searchQuery, mode: 'insensitive' } },
        { model: { contains: searchQuery, mode: 'insensitive' } },
        { makeModel: { contains: searchQuery, mode: 'insensitive' } },
        { serialNumber: { contains: searchQuery, mode: 'insensitive' } },
        { vin: { contains: searchQuery, mode: 'insensitive' } },
      ]
    }

    // Build orderBy clause
    let orderBy: any = {}
    if (sortBy === 'date') {
      orderBy = { createdAt: sortOrder }
    } else if (sortBy === 'value') {
      orderBy = { estimatedValue: sortOrder }
    } else if (sortBy === 'brand') {
      orderBy = { brand: sortOrder }
    }

    const items = await prisma.item.findMany({
      where,
      orderBy,
      include: {
        category: true,
        mediaAssets: {
          take: 1,
          where: {
            type: 'photo',
          },
          orderBy: {
            uploadedAt: 'asc',
          },
        },
        _count: {
          select: {
            mediaAssets: true,
            provenanceEvents: true,
          },
        },
      },
    })

    // Generate signed URLs for media assets
    const itemsWithSignedUrls = await Promise.all(
      items.map(async (item) => {
        if (item.mediaAssets && item.mediaAssets.length > 0) {
          const mediaAssetsWithUrls = await Promise.all(
            item.mediaAssets.map(async (asset) => {
              try {
                const signedUrl = await downloadFile(asset.cloudStoragePath, 3600);
                return {
                  ...asset,
                  cloudStoragePath: signedUrl, // Replace S3 key with signed URL
                };
              } catch (error) {
                console.error('Error generating signed URL:', error);
                return asset; // Return original if signing fails
              }
            })
          );
          return {
            ...item,
            mediaAssets: mediaAssetsWithUrls,
          };
        }
        return item;
      })
    );

    return NextResponse.json({ items: itemsWithSignedUrls })
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}

// POST /api/items - Create a new item
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

    // Check for required user fields
    if (!user.id || !user.organizationId) {
      console.error('Missing user fields:', { id: user.id, organizationId: user.organizationId })
      return NextResponse.json(
        { error: 'Invalid user session. Please log out and log in again.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('Received item creation request:', JSON.stringify(body, null, 2))
    
    const validatedData = createItemSchema.parse(body)

    // Convert string prices to Decimal
    const itemData: any = {
      ...validatedData,
      organizationId: user.organizationId,
      createdByUserId: user.id,
    }

    if (validatedData.purchaseDate) {
      itemData.purchaseDate = new Date(validatedData.purchaseDate)
    }

    if (validatedData.purchasePrice) {
      const parsedPrice = parseFloat(validatedData.purchasePrice)
      if (isNaN(parsedPrice)) {
        return NextResponse.json(
          { error: 'Invalid purchase price format' },
          { status: 400 }
        )
      }
      itemData.purchasePrice = parsedPrice
    }

    if (validatedData.estimatedValue) {
      const parsedValue = parseFloat(validatedData.estimatedValue)
      if (isNaN(parsedValue)) {
        return NextResponse.json(
          { error: 'Invalid estimated value format' },
          { status: 400 }
        )
      }
      itemData.estimatedValue = parsedValue
    }

    console.log('Creating item with data:', JSON.stringify(itemData, null, 2))

    const item = await prisma.item.create({
      data: itemData,
      include: {
        category: true,
      },
    })

    // Create initial provenance event
    await prisma.provenanceEvent.create({
      data: {
        itemId: item.id,
        userId: user.id,
        eventType: 'registered',
        title: 'Asset Registered',
        description: `${item.category.name} registered in the vault`,
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating item:', error)
    // Provide more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create item', details: errorMessage },
      { status: 500 }
    )
  }
}
