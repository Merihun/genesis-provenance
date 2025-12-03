/**
 * CSV Export Utilities for Genesis Provenance
 * Generates CSV files for vault items export
 */

import { Item, ItemCategory, ItemStatus } from '@prisma/client';
import { formatCurrency, formatDate } from './pdf-generator';

type ItemWithCategory = Item & {
  category: ItemCategory;
};

export interface CSVExportOptions {
  includeFinancials?: boolean;
  includeProvenance?: boolean;
  customColumns?: string[];
}

/**
 * Convert items to CSV format
 */
export function generateItemsCSV(
  items: ItemWithCategory[],
  options: CSVExportOptions = {}
): string {
  const {
    includeFinancials = true,
    includeProvenance = false,
  } = options;

  // Define base columns
  const baseColumns = [
    'Asset ID',
    'Category',
    'Brand',
    'Model',
    'Year',
    'Serial Number',
    'VIN',
    'Status',
    'Authentication Status',
    'Created Date',
  ];

  // Add financial columns if requested
  const financialColumns = includeFinancials
    ? ['Purchase Price', 'Estimated Value', 'Portfolio %']
    : [];

  // Combine all columns
  const columns = [...baseColumns, ...financialColumns];

  // Calculate total value for portfolio percentage
  const totalValue = items.reduce(
    (sum: number, item: any) => sum + (Number(item.estimatedValue) || 0),
    0
  );

  // Generate CSV header
  const csvLines = [columns.join(',')];

  // Generate CSV rows
  items.forEach((item: any) => {
    const row = [
      escapeCSV(item.id),
      escapeCSV(item.category.name),
      escapeCSV(item.brand || ''),
      escapeCSV(item.model || ''),
      escapeCSV(item.year?.toString() || ''),
      escapeCSV(item.serialNumber || ''),
      escapeCSV(item.vin || ''),
      escapeCSV(formatStatus(item.status)),
      escapeCSV(formatAuthStatus(item.authenticationStatus)),
      escapeCSV(formatDate(item.createdAt, 'short')),
    ];

    // Add financial data if included
    if (includeFinancials) {
      const estimatedValue = Number(item.estimatedValue) || 0;
      const portfolioPercent =
        totalValue > 0 ? ((estimatedValue / totalValue) * 100).toFixed(2) : '0.00';

      row.push(
        escapeCSV(item.purchasePrice ? formatCurrency(item.purchasePrice) : 'N/A'),
        escapeCSV(item.estimatedValue ? formatCurrency(item.estimatedValue) : 'N/A'),
        escapeCSV(`${portfolioPercent}%`)
      );
    }

    csvLines.push(row.join(','));
  });

  return csvLines.join('\n');
}

/**
 * Generate portfolio summary CSV
 */
export function generatePortfolioSummaryCSV(items: ItemWithCategory[]): string {
  const columns = [
    'Category',
    'Total Items',
    'Total Value',
    'Average Value',
    'Verified Count',
    'Pending Count',
    'Portfolio %',
  ];

  const csvLines = [columns.join(',')];

  // Group by category
  const categoryGroups = items.reduce((acc: any, item: any) => {
    const categoryName = item.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, ItemWithCategory[]>);

  // Calculate total portfolio value
  const totalPortfolioValue = items.reduce(
    (sum: number, item: any) => sum + (Number(item.estimatedValue) || 0),
    0
  );

  // Generate rows for each category
  Object.entries(categoryGroups).forEach(([categoryName, categoryItems]: [string, any]) => {
    const totalValue = categoryItems.reduce(
      (sum: number, item: any) => sum + (Number(item.estimatedValue) || 0),
      0
    );
    const avgValue = categoryItems.length > 0 ? totalValue / categoryItems.length : 0;
    const verifiedCount = categoryItems.filter(
      (item: any) => item.status === ItemStatus.verified
    ).length;
    const pendingCount = categoryItems.filter(
      (item: any) => item.status === ItemStatus.pending
    ).length;
    const portfolioPercent =
      totalPortfolioValue > 0
        ? ((totalValue / totalPortfolioValue) * 100).toFixed(2)
        : '0.00';

    const row = [
      escapeCSV(categoryName),
      escapeCSV(categoryItems.length.toString()),
      escapeCSV(formatCurrency(totalValue)),
      escapeCSV(formatCurrency(avgValue)),
      escapeCSV(verifiedCount.toString()),
      escapeCSV(pendingCount.toString()),
      escapeCSV(`${portfolioPercent}%`),
    ];

    csvLines.push(row.join(','));
  });

  // Add totals row
  const verifiedTotal = items.filter(
    (item: any) => item.status === ItemStatus.verified
  ).length;
  const pendingTotal = items.filter(
    (item: any) => item.status === ItemStatus.pending
  ).length;

  csvLines.push(
    [
      escapeCSV('TOTAL'),
      escapeCSV(items.length.toString()),
      escapeCSV(formatCurrency(totalPortfolioValue)),
      escapeCSV(formatCurrency(items.length > 0 ? totalPortfolioValue / items.length : 0)),
      escapeCSV(verifiedTotal.toString()),
      escapeCSV(pendingTotal.toString()),
      escapeCSV('100.00%'),
    ].join(',')
  );

  return csvLines.join('\n');
}

/**
 * Escape CSV special characters
 */
function escapeCSV(value: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the value contains comma, quote, or newline, wrap it in quotes
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    // Escape quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Format status enum for display
 */
function formatStatus(status: ItemStatus): string {
  const statusMap: Record<ItemStatus, string> = {
    [ItemStatus.pending]: 'Pending',
    [ItemStatus.verified]: 'Verified',
    [ItemStatus.flagged]: 'Flagged',
    [ItemStatus.rejected]: 'Rejected',
  };
  return statusMap[status] || status;
}

/**
 * Format authentication status for display
 */
function formatAuthStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    authenticated: 'Authenticated',
    flagged: 'Flagged',
    verified: 'Verified',
  };
  return statusMap[status] || status;
}

/**
 * Generate filename for CSV export
 */
export function generateCSVFilename(prefix: string = 'export'): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `genesis-provenance-${prefix}-${timestamp}.csv`;
}
