// Utility functions for PDF generation
// This file can be extended with additional PDF templates and utilities

import PDFDocument from 'pdfkit';

export function formatCurrency(value: number | string | null): string {
  if (!value) return 'N/A';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `$${numValue.toLocaleString()}`;
}

export function formatDate(date: Date | string, format: 'short' | 'long' = 'long'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function generateCertificateToken(): string {
  return `GP-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Common PDF Styling Constants
 */
export const PDF_COLORS = {
  primary: '#1e3a8a', // Navy blue
  secondary: '#d4af37', // Gold
  text: '#1f2937',
  lightGray: '#f3f4f6',
  border: '#e5e7eb',
};

export const PDF_FONTS = {
  title: 24,
  heading: 18,
  subheading: 14,
  body: 12,
  small: 10,
};

/**
 * Add PDF Header with Genesis Provenance branding
 */
export function addPDFHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  subtitle?: string
): void {
  // Header background
  doc
    .rect(0, 0, doc.page.width, 80)
    .fill(PDF_COLORS.primary);

  // Title
  doc
    .fontSize(PDF_FONTS.title)
    .fillColor('white')
    .text('Genesis Provenance', 50, 25, { align: 'left' });

  // Subtitle/Report Type
  if (subtitle) {
    doc
      .fontSize(PDF_FONTS.body)
      .fillColor(PDF_COLORS.secondary)
      .text(subtitle, 50, 52, { align: 'left' });
  }

  // Report Title
  doc
    .fontSize(PDF_FONTS.heading)
    .fillColor(PDF_COLORS.text)
    .text(title, 50, 100);

  // Reset Y position
  doc.moveDown(2);
}

/**
 * Add PDF Footer with page numbers and generation date
 */
export function addPDFFooter(
  doc: PDFKit.PDFDocument,
  pageNumber: number,
  totalPages: number
): void {
  const bottom = doc.page.height - 50;

  doc
    .fontSize(PDF_FONTS.small)
    .fillColor('#666666')
    .text(
      `Generated on ${formatDate(new Date(), 'long')}`,
      50,
      bottom,
      { align: 'left' }
    )
    .text(
      `Page ${pageNumber} of ${totalPages}`,
      50,
      bottom,
      { align: 'right' }
    );
}

/**
 * Add a section divider
 */
export function addSectionDivider(
  doc: PDFKit.PDFDocument,
  title: string
): void {
  doc.moveDown(1);
  doc
    .fontSize(PDF_FONTS.subheading)
    .fillColor(PDF_COLORS.primary)
    .text(title, { underline: true });
  doc.moveDown(0.5);
}

/**
 * Add a key-value pair row
 */
export function addKeyValueRow(
  doc: PDFKit.PDFDocument,
  key: string,
  value: string,
  indent: number = 50
): void {
  const y = doc.y;
  doc
    .fontSize(PDF_FONTS.body)
    .fillColor('#666666')
    .text(key + ':', indent, y, { width: 150, continued: false });
  
  doc
    .fillColor(PDF_COLORS.text)
    .text(value, indent + 160, y);
  
  doc.moveDown(0.3);
}

/**
 * Add a table to the PDF
 */
export function addTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  columnWidths: number[]
): void {
  const startX = 50;
  let startY = doc.y;
  const rowHeight = 25;

  // Draw header
  doc
    .fontSize(PDF_FONTS.body)
    .fillColor('white');

  headers.forEach((header, i) => {
    const x = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc
      .rect(x, startY, columnWidths[i], rowHeight)
      .fill(PDF_COLORS.primary);
    doc
      .fillColor('white')
      .text(header, x + 5, startY + 7, {
        width: columnWidths[i] - 10,
        align: 'left',
      });
  });

  startY += rowHeight;

  // Draw rows
  rows.forEach((row, rowIndex) => {
    const fillColor = rowIndex % 2 === 0 ? 'white' : PDF_COLORS.lightGray;
    
    row.forEach((cell, colIndex) => {
      const x = startX + columnWidths.slice(0, colIndex).reduce((a, b) => a + b, 0);
      
      doc
        .rect(x, startY, columnWidths[colIndex], rowHeight)
        .fill(fillColor);
      
      doc
        .fontSize(PDF_FONTS.small)
        .fillColor(PDF_COLORS.text)
        .text(cell || 'N/A', x + 5, startY + 7, {
          width: columnWidths[colIndex] - 10,
          align: 'left',
        });
    });

    startY += rowHeight;
    
    // Check if we need a new page
    if (startY > doc.page.height - 100) {
      doc.addPage();
      startY = 50;
    }
  });

  doc.y = startY + 10;
}
