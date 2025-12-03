import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/items/similar
 * Find similar assets based on brand, model, category
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const brand = searchParams.get('brand');
    const model = searchParams.get('model');
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!brand && !model && !categoryId) {
      return NextResponse.json(
        { error: 'At least one search parameter required (brand, model, or categoryId)' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      status: 'verified', // Only show verified items as comparables
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Search by brand or model (case-insensitive partial match)
    if (brand || model) {
      where.OR = [];
      
      if (brand) {
        where.OR.push({
          brand: {
            contains: brand,
            mode: 'insensitive' as const,
          },
        });
      }

      if (model) {
        where.OR.push(
          {
            model: {
              contains: model,
              mode: 'insensitive' as const,
            },
          },
          {
            makeModel: {
              contains: model,
              mode: 'insensitive' as const,
            },
          }
        );
      }
    }

    // Fetch similar items
    const similarItems = await prisma.item.findMany({
      where,
      select: {
        id: true,
        brand: true,
        model: true,
        makeModel: true,
        year: true,
        estimatedValue: true,
        purchasePrice: true,
        categoryId: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        mediaAssets: {
          select: {
            id: true,
            cloudStoragePath: true,
            type: true,
          },
          where: {
            isPublic: false,
          },
          take: 1,
        },
        createdAt: true,
      },
      orderBy: [
        // Prioritize by estimated value (descending)
        { estimatedValue: 'desc' },
        { createdAt: 'desc' },
      ],
      take: Math.min(limit, 10), // Max 10 results
    });

    // Calculate average values for comparison (convert Decimal to number)
    const values = similarItems
      .map(item => {
        const val = item.estimatedValue || item.purchasePrice || 0;
        return typeof val === 'number' ? val : Number(val);
      })
      .filter(v => v > 0);

    const avgValue = values.length > 0
      ? values.reduce((sum: number, v: number) => sum + v, 0) / values.length
      : 0;

    const minValue = values.length > 0 ? Math.min(...values) : 0;
    const maxValue = values.length > 0 ? Math.max(...values) : 0;

    return NextResponse.json({
      items: similarItems,
      count: similarItems.length,
      valueInsights: {
        average: Math.round(avgValue),
        min: minValue,
        max: maxValue,
      },
      searchCriteria: {
        brand,
        model,
        categoryId,
      },
    });
  } catch (error) {
    console.error('Error fetching similar items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
