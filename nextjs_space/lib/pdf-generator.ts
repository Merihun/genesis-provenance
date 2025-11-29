// Utility functions for PDF generation
// This file can be extended with additional PDF templates and utilities

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
