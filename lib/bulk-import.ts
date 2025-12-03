import { parse } from 'csv/sync';
import { ItemStatus } from '@prisma/client';

// ==================== TYPES ====================

export interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
  mappedData: Partial<ItemData>;
  errors: ValidationError[];
  warnings: string[];
  isValid: boolean;
}

export interface ItemData {
  brand: string;
  model: string;
  year: number | null;
  serialNumber: string | null;
  referenceNumber: string | null;
  vin: string | null;
  makeModel: string | null;
  matchingNumbers: boolean | null;
  purchasePrice: number | null;
  purchaseDate: Date | null;
  estimatedValue: number | null;
  notes: string | null;
  status: ItemStatus;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ColumnMapping {
  [csvColumn: string]: keyof ItemData | null;
}

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  suggestedMapping: ColumnMapping;
}

// ==================== COLUMN MAPPING ====================

const FIELD_PATTERNS: Record<keyof ItemData, RegExp[]> = {
  brand: [/brand/i, /manufacturer/i, /make/i],
  model: [/model/i, /type/i, /series/i],
  year: [/year/i, /date/i, /manufactured/i],
  serialNumber: [/serial/i, /sn/i, /serial.*number/i],
  referenceNumber: [/reference/i, /ref/i, /ref.*number/i, /reference.*number/i],
  vin: [/^vin$/i, /vehicle.*identification/i],
  makeModel: [/make.*model/i, /vehicle.*name/i],
  matchingNumbers: [/matching/i, /numbers.*matching/i],
  purchasePrice: [/purchase.*price/i, /price.*paid/i, /cost/i],
  purchaseDate: [/purchase.*date/i, /date.*purchased/i, /acquired/i],
  estimatedValue: [/estimated.*value/i, /current.*value/i, /market.*value/i, /value/i],
  notes: [/notes/i, /description/i, /comments/i, /remarks/i],
  status: [/status/i, /condition/i, /state/i],
};

/**
 * Automatically suggests column mapping based on header names
 */
export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usedFields = new Set<keyof ItemData>();

  for (const header of headers) {
    const cleanHeader = header.trim();
    let bestMatch: keyof ItemData | null = null;
    let bestMatchScore = 0;

    // Try to match against each field pattern
    for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(cleanHeader)) {
          // Calculate match score (prefer exact matches)
          const score = cleanHeader.toLowerCase() === field.toLowerCase() ? 2 : 1;
          if (score > bestMatchScore && !usedFields.has(field as keyof ItemData)) {
            bestMatch = field as keyof ItemData;
            bestMatchScore = score;
          }
        }
      }
    }

    if (bestMatch) {
      mapping[cleanHeader] = bestMatch;
      usedFields.add(bestMatch);
    } else {
      mapping[cleanHeader] = null; // Unmapped column
    }
  }

  return mapping;
}

// ==================== VALIDATION ====================

/**
 * Validates a single row of data
 */
function validateRow(data: Partial<ItemData>, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required field: brand
  if (!data.brand || data.brand.trim() === '') {
    errors.push({
      field: 'brand',
      message: 'Brand is required',
      severity: 'error',
    });
  }

  // Required field: model
  if (!data.model || data.model.trim() === '') {
    errors.push({
      field: 'model',
      message: 'Model is required',
      severity: 'error',
    });
  }

  // Validate year (if provided)
  if (data.year !== null && data.year !== undefined) {
    const currentYear = new Date().getFullYear();
    if (isNaN(data.year) || data.year < 1800 || data.year > currentYear + 1) {
      errors.push({
        field: 'year',
        message: `Year must be between 1800 and ${currentYear + 1}`,
        severity: 'error',
      });
    }
  }

  // Validate prices
  if (data.purchasePrice !== null && data.purchasePrice !== undefined) {
    if (isNaN(data.purchasePrice) || data.purchasePrice < 0) {
      errors.push({
        field: 'purchasePrice',
        message: 'Purchase price must be a positive number',
        severity: 'error',
      });
    }
  }

  if (data.estimatedValue !== null && data.estimatedValue !== undefined) {
    if (isNaN(data.estimatedValue) || data.estimatedValue < 0) {
      errors.push({
        field: 'estimatedValue',
        message: 'Estimated value must be a positive number',
        severity: 'error',
      });
    }
  }

  // Validate status
  if (data.status) {
    const validStatuses: ItemStatus[] = ['pending', 'verified', 'flagged'];
    if (!validStatuses.includes(data.status)) {
      errors.push({
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
        severity: 'error',
      });
    }
  }

  return errors;
}

/**
 * Applies column mapping to a raw CSV row
 */
function applyMapping(
  rawRow: Record<string, string>,
  mapping: ColumnMapping
): Partial<ItemData> {
  const mappedData: Partial<ItemData> = {
    status: 'pending', // Default status
  };

  for (const [csvColumn, field] of Object.entries(mapping)) {
    if (!field) continue; // Skip unmapped columns

    const value = rawRow[csvColumn]?.trim();
    if (!value) continue; // Skip empty values

    // Type conversion based on field
    switch (field) {
      case 'year':
        const yearNum = parseInt(value, 10);
        mappedData.year = isNaN(yearNum) ? null : yearNum;
        break;

      case 'purchasePrice':
      case 'estimatedValue':
        // Remove currency symbols and commas
        const cleanValue = value.replace(/[^0-9.]/g, '');
        const numValue = parseFloat(cleanValue);
        mappedData[field] = isNaN(numValue) ? null : numValue;
        break;

      case 'purchaseDate':
        try {
          const date = new Date(value);
          mappedData.purchaseDate = isNaN(date.getTime()) ? null : date;
        } catch {
          mappedData.purchaseDate = null;
        }
        break;

      case 'matchingNumbers':
        const boolValue = value.toLowerCase();
        if (boolValue === 'true' || boolValue === 'yes' || boolValue === '1') {
          mappedData.matchingNumbers = true;
        } else if (boolValue === 'false' || boolValue === 'no' || boolValue === '0') {
          mappedData.matchingNumbers = false;
        } else {
          mappedData.matchingNumbers = null;
        }
        break;

      case 'status':
        const statusValue = value.toLowerCase();
        if (statusValue === 'verified' || statusValue === 'pending' || statusValue === 'flagged') {
          mappedData.status = statusValue as ItemStatus;
        }
        break;

      default:
        // String fields
        (mappedData as any)[field] = value;
    }
  }

  return mappedData;
}

// ==================== CSV PARSING ====================

/**
 * Parses CSV content and validates all rows
 */
export function parseCSV(
  csvContent: string,
  mapping?: ColumnMapping
): ParseResult {
  try {
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    if (records.length === 0) {
      throw new Error('CSV file is empty or contains no valid rows');
    }

    // Get headers
    const headers = Object.keys(records[0]);

    // Suggest or use provided mapping
    const columnMapping = mapping || suggestColumnMapping(headers);

    // Process each row
    const parsedRows: ParsedRow[] = [];
    let validCount = 0;

    for (let i = 0; i < records.length; i++) {
      const rawRow = records[i];
      const mappedData = applyMapping(rawRow, columnMapping);
      const errors = validateRow(mappedData, i + 2); // +2 for header row and 1-based indexing
      const warnings: string[] = [];

      // Add warnings for unmapped columns with data
      for (const [col, val] of Object.entries(rawRow)) {
        if (val && val.trim() && !columnMapping[col]) {
          warnings.push(`Column "${col}" is not mapped and will be ignored`);
        }
      }

      const isValid = errors.filter((e) => e.severity === 'error').length === 0;
      if (isValid) validCount++;

      parsedRows.push({
        rowNumber: i + 2, // +2 for header and 1-based
        data: rawRow,
        mappedData,
        errors,
        warnings: Array.from(new Set(warnings)), // Remove duplicates
        isValid,
      });
    }

    return {
      headers,
      rows: parsedRows,
      totalRows: records.length,
      validRows: validCount,
      invalidRows: records.length - validCount,
      suggestedMapping: columnMapping,
    };
  } catch (error: any) {
    throw new Error(`Failed to parse CSV: ${error.message}`);
  }
}

// ==================== TEMPLATE GENERATION ====================

/**
 * Generates a CSV template with example data
 */
export function generateCSVTemplate(includeExamples: boolean = true): string {
  const headers = [
    'Brand',
    'Model',
    'Year',
    'Serial Number',
    'Reference Number',
    'VIN',
    'Purchase Price',
    'Purchase Date',
    'Estimated Value',
    'Notes',
    'Status',
  ];

  const examples = [
    [
      'Rolex',
      'Submariner',
      '2020',
      'S123456789',
      '116610LN',
      '',
      '8500',
      '2020-06-15',
      '12000',
      'Excellent condition with box and papers',
      'verified',
    ],
    [
      'Ferrari',
      '488 GTB',
      '2018',
      '',
      '',
      'ZFF79ALA9J0234567',
      '285000',
      '2018-03-20',
      '320000',
      'Rosso Corsa, low mileage',
      'pending',
    ],
    [
      'Hermès',
      'Birkin 35',
      '2021',
      'HB12345',
      '',
      '',
      '15000',
      '2021-11-10',
      '18000',
      'Togo leather in Etoupe',
      'verified',
    ],
  ];

  let csv = headers.join(',') + '\n';

  if (includeExamples) {
    for (const row of examples) {
      csv += row.map((cell) => `"${cell}"`).join(',') + '\n';
    }
  }

  return csv;
}
