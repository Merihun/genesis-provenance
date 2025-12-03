import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { ItemStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface SmartCollection {
  id: string
  name: string
  description: string
  icon: string
  count: number
  filters: any
}

// GET /api/collections - Get smart collections with item counts
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

    // Define smart collection rules
    const baseWhere = { organizationId: user.organizationId }

    // Get counts for each smart collection in parallel
    const [highValueCount, pendingReviewCount, recentCount, verifiedCount, flaggedCount] = await Promise.all([
      // High Value Assets (estimated value > $10,000)
      prisma.item.count({
        where: {
          ...baseWhere,
          estimatedValue: { gte: 10000 },
        },
      }),
      // Pending Review
      prisma.item.count({
        where: {
          ...baseWhere,
          status: ItemStatus.pending,
        },
      }),
      // Recent Additions (last 30 days)
      prisma.item.count({
        where: {
          ...baseWhere,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      // Verified Assets
      prisma.item.count({
        where: {
          ...baseWhere,
          status: ItemStatus.verified,
        },
      }),
      // Flagged for Review
      prisma.item.count({
        where: {
          ...baseWhere,
          status: ItemStatus.flagged,
        },
      }),
    ])

    // Get AI authentication stats
    const aiAuthCount = await prisma.aIAnalysis.count({
      where: {
        item: {
          organizationId: user.organizationId,
        },
        status: 'completed',
      },
    })

    // Build smart collections
    const collections: SmartCollection[] = [
      {
        id: 'high-value',
        name: 'High Value',
        description: 'Assets with estimated value over $10,000',
        icon: 'TrendingUp',
        count: highValueCount,
        filters: {
          minEstimatedValue: 10000,
        },
      },
      {
        id: 'pending-review',
        name: 'Pending Review',
        description: 'Assets awaiting verification',
        icon: 'Clock',
        count: pendingReviewCount,
        filters: {
          statuses: [ItemStatus.pending],
        },
      },
      {
        id: 'recent',
        name: 'Recent Additions',
        description: 'Assets added in the last 30 days',
        icon: 'Calendar',
        count: recentCount,
        filters: {
          createdAtFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
      {
        id: 'verified',
        name: 'Verified',
        description: 'All verified assets',
        icon: 'CheckCircle2',
        count: verifiedCount,
        filters: {
          statuses: [ItemStatus.verified],
        },
      },
      {
        id: 'flagged',
        name: 'Flagged',
        description: 'Assets flagged for review',
        icon: 'AlertTriangle',
        count: flaggedCount,
        filters: {
          statuses: [ItemStatus.flagged],
        },
      },
      {
        id: 'ai-authenticated',
        name: 'AI Authenticated',
        description: 'Assets with completed AI authentication',
        icon: 'Sparkles',
        count: aiAuthCount,
        filters: {
          // Special filter handled separately in the UI
        },
      },
    ]

    return NextResponse.json({ collections })
  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    )
  }
}
