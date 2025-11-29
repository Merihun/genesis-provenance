import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    // Find certificate
    const certificate = await prisma.certificate.findUnique({
      where: {
        certificateToken: token,
      },
      include: {
        item: {
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!certificate || !certificate.isActive) {
      return NextResponse.json(
        { error: 'Certificate not found or inactive' },
        { status: 404 }
      );
    }

    // Get provenance event count
    const provenanceEventCount = await prisma.provenanceEvent.count({
      where: {
        itemId: certificate.itemId,
      },
    });

    return NextResponse.json({
      certificate: {
        id: certificate.id,
        certificateToken: certificate.certificateToken,
        generatedAt: certificate.generatedAt.toISOString(),
        isActive: certificate.isActive,
      },
      item: {
        id: certificate.item.id,
        brand: certificate.item.brand,
        model: certificate.item.model,
        year: certificate.item.year,
        referenceNumber: certificate.item.referenceNumber,
        serialNumber: certificate.item.serialNumber,
        vin: certificate.item.vin,
        matchingNumbers: certificate.item.matchingNumbers,
        status: certificate.item.status,
        category: certificate.item.category,
        estimatedValue: certificate.item.estimatedValue?.toString() || null,
        createdAt: certificate.item.createdAt.toISOString(),
      },
      provenanceEventCount,
    });
  } catch (error) {
    console.error('Certificate verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify certificate' },
      { status: 500 }
    );
  }
}
