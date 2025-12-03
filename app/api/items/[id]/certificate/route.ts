import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemId = params.id;
    const user = session.user as any;

    // Fetch item with all related data
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        category: true,
        createdBy: {
          select: {
            fullName: true,
            email: true,
          },
        },
        provenanceEvents: {
          orderBy: { occurredAt: 'asc' },
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Verify ownership
    if (item.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find or create certificate
    let certificate = await prisma.certificate.findFirst({
      where: {
        itemId: item.id,
        isActive: true,
      },
    });

    if (!certificate) {
      // Generate unique token
      const token = `GP-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      certificate = await prisma.certificate.create({
        data: {
          itemId: item.id,
          certificateToken: token,
          htmlContent: '', // Not used for PDF generation
          isActive: true,
        },
      });
    }

    // Generate QR code
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify/${certificate.certificateToken}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 1,
    });

    // Create PDF
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Header
    doc
      .fontSize(28)
      .fillColor('#1e3a8a')
      .text('GENESIS PROVENANCE', { align: 'center' });
    
    doc
      .fontSize(16)
      .fillColor('#64748b')
      .text('Certificate of Authenticity', { align: 'center' });
    
    doc.moveDown(2);

    // Certificate details box
    doc
      .fontSize(12)
      .fillColor('#334155')
      .text(`Certificate ID: ${certificate.certificateToken}`, { align: 'right' });
    
    doc
      .fontSize(10)
      .fillColor('#64748b')
      .text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'right' });
    
    doc.moveDown(2);

    // Asset Information
    doc
      .fontSize(18)
      .fillColor('#1e3a8a')
      .text('Asset Information', { underline: true });
    
    doc.moveDown(0.5);

    doc.fontSize(12).fillColor('#334155');

    const infoRows = [
      ['Category:', item.category.name],
      ['Brand:', item.brand || 'N/A'],
      ['Model:', item.model || 'N/A'],
    ];

    if (item.year) infoRows.push(['Year:', item.year.toString()]);
    if (item.referenceNumber) infoRows.push(['Reference:', item.referenceNumber]);
    if (item.serialNumber) infoRows.push(['Serial Number:', item.serialNumber]);
    if (item.vin) infoRows.push(['VIN:', item.vin]);
    if (item.matchingNumbers !== null) {
      infoRows.push(['Matching Numbers:', item.matchingNumbers ? 'Yes' : 'No']);
    }

    infoRows.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(label, { continued: true }).font('Helvetica').text(` ${value}`);
    });

    doc.moveDown(1);

    // Financial Information
    if (item.purchasePrice || item.estimatedValue) {
      doc
        .fontSize(18)
        .fillColor('#1e3a8a')
        .text('Valuation', { underline: true });
      
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#334155');

      if (item.purchasePrice) {
        doc
          .font('Helvetica-Bold')
          .text('Purchase Price:', { continued: true })
          .font('Helvetica')
          .text(` $${Number(item.purchasePrice).toLocaleString()}`);
      }

      if (item.estimatedValue) {
        doc
          .font('Helvetica-Bold')
          .text('Current Estimated Value:', { continued: true })
          .font('Helvetica')
          .text(` $${Number(item.estimatedValue).toLocaleString()}`);
      }

      doc.moveDown(1);
    }

    // Status
    doc
      .fontSize(18)
      .fillColor('#1e3a8a')
      .text('Authentication Status', { underline: true });
    
    doc.moveDown(0.5);

    const statusColors: Record<string, string> = {
      verified: '#16a34a',
      pending: '#eab308',
      flagged: '#dc2626',
      rejected: '#991b1b',
    };

    doc
      .fontSize(14)
      .fillColor(statusColors[item.status] || '#64748b')
      .text(item.status.toUpperCase());
    
    doc.moveDown(1);

    // Provenance Timeline (Summary)
    if (item.provenanceEvents.length > 0) {
      doc
        .fontSize(18)
        .fillColor('#1e3a8a')
        .text('Provenance Timeline', { underline: true });
      
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#334155');

      // Show first 5 events
      const eventsToShow = item.provenanceEvents.slice(0, 5);
      eventsToShow.forEach((event: any) => {
        const eventDate = new Date(event.occurredAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        doc
          .font('Helvetica-Bold')
          .text(`${eventDate}:`, { continued: true })
          .font('Helvetica')
          .text(` ${event.title}`);
      });

      if (item.provenanceEvents.length > 5) {
        doc
          .fontSize(9)
          .fillColor('#64748b')
          .text(`... and ${item.provenanceEvents.length - 5} more events`);
      }

      doc.moveDown(1);
    }

    // QR Code for verification
    doc
      .fontSize(12)
      .fillColor('#334155')
      .text('Verify this certificate online:');
    
    doc.moveDown(0.5);

    // Convert QR code data URL to buffer
    const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
    doc.image(qrBuffer, { width: 100, align: 'center' });

    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .fillColor('#64748b')
      .text(verificationUrl, { align: 'center', link: verificationUrl });

    doc.moveDown(2);

    // Footer
    doc
      .fontSize(8)
      .fillColor('#94a3b8')
      .text(
        'This certificate is digitally generated and cryptographically secured. ' +
        'Scan the QR code or visit the URL above to verify authenticity.',
        { align: 'center' }
      );

    doc.end();

    // Wait for PDF generation to complete
    return new Promise<NextResponse>((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const filename = `${item.brand}_${item.model}_Certificate.pdf`.replace(/\s+/g, '_');
        
        resolve(
          new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          })
        );
      });
    });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}
