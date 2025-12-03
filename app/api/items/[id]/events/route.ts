import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createEventSchema = z.object({
  eventType: z.enum(['restoration_work', 'service_record', 'concours_event', 'appraisal', 'inspection', 'note_added', 'ownership_transfer']),
  title: z.string().min(1),
  description: z.string().optional(),
  occurredAt: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// POST /api/items/[id]/events - Create a new provenance event
export async function POST(
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

    // Verify item ownership
    const item = await prisma.item.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = createEventSchema.parse(body)

    const eventData: any = {
      itemId: params.id,
      userId: user.id,
      eventType: validatedData.eventType,
      title: validatedData.title,
      description: validatedData.description,
      metadata: validatedData.metadata,
    }

    if (validatedData.occurredAt) {
      eventData.occurredAt = new Date(validatedData.occurredAt)
    }

    const event = await prisma.provenanceEvent.create({
      data: eventData,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

// GET /api/items/[id]/events - Get all events for an item
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

    // Verify item ownership
    const item = await prisma.item.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    const events = await prisma.provenanceEvent.findMany({
      where: { itemId: params.id },
      orderBy: { occurredAt: 'desc' },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
