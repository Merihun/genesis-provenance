'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemCategory {
  id: string;
  name: string;
  slug: string;
}

interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
  mappedData: any;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: string[];
  isValid: boolean;
}

interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  suggestedMapping?: Record<string, string | null>;
}

export default function BulkImportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  // State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [importId, setImportId] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string | null>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Authentication check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    }
    fetchCategories();
  }, []);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'File size must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    
    // Read file content
    const content = await selectedFile.text();
    setCsvContent(content);
  };

  // Step 1: Upload file
  const handleUpload = async () => {
    if (!file || !csvContent) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to upload',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedCategoryId) {
        formData.append('categoryId', selectedCategoryId);
      }

      const res = await fetch('/api/bulk-import/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await res.json();
      setImportId(data.importId);
      setParseResult(data.parseResult);
      setColumnMapping(data.parseResult.suggestedMapping || {});
      setStep(2);

      toast({
        title: 'File uploaded successfully',
        description: `Parsed ${data.parseResult.totalRows} rows (${data.parseResult.validRows} valid, ${data.parseResult.invalidRows} invalid)`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Step 2: Update preview with custom mapping
  const handleUpdatePreview = async () => {
    if (!csvContent) return;

    setIsUploading(true);

    try {
      const res = await fetch('/api/bulk-import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent,
          mapping: columnMapping,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Preview failed');
      }

      const data = await res.json();
      setParseResult(data.parseResult);

      toast({
        title: 'Preview updated',
        description: `${data.parseResult.validRows} valid rows, ${data.parseResult.invalidRows} invalid rows`,
      });
    } catch (error: any) {
      console.error('Preview error:', error);
      toast({
        title: 'Preview failed',
        description: error.message || 'Failed to update preview',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Step 3: Execute import
  const handleExecute = async () => {
    if (!importId || !csvContent || !parseResult) {
      toast({
        title: 'Cannot execute import',
        description: 'Missing required data',
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);

    try {
      const res = await fetch('/api/bulk-import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importId,
          csvContent,
          mapping: columnMapping,
          categoryId: selectedCategoryId || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Import failed');
      }

      const data = await res.json();
      setStep(4);

      toast({
        title: 'Import completed',
        description: `Successfully imported ${data.result.successRows} items`,
      });
    } catch (error: any) {
      console.error('Execute error:', error);
      toast({
        title: 'Import failed',
        description: error.message || 'Failed to execute import',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    window.open('/api/bulk-import/template', '_blank');
  };

  // Toggle row expansion
  const toggleRowExpansion = (rowNumber: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowNumber)) {
        newSet.delete(rowNumber);
      } else {
        newSet.add(rowNumber);
      }
      return newSet;
    });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Bulk Import Assets</h1>
        <p className="text-slate-600 mt-2">
          Import multiple assets at once using a CSV file
        </p>
      </div>

      {/* Stepper */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Upload' },
            { num: 2, label: 'Map Columns' },
            { num: 3, label: 'Preview' },
            { num: 4, label: 'Complete' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full font-semibold',
                  step >= s.num
                    ? 'bg-yellow-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                )}
              >
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span
                className={cn(
                  'ml-3 text-sm font-medium',
                  step >= s.num ? 'text-slate-900' : 'text-slate-500'
                )}
              >
                {s.label}
              </span>
              {idx < 3 && (
                <ArrowRight className="mx-4 text-slate-300" size={20} />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Step 1: Upload CSV File
            </h2>
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Upload a CSV file with your asset data. Not sure about the format?
                <Button
                  variant="link"
                  className="px-1 h-auto text-yellow-600 hover:text-yellow-700"
                  onClick={handleDownloadTemplate}
                >
                  Download template
                </Button>
              </AlertDescription>
            </Alert>
          </div>

          {/* Category Selection */}
          <div>
            <Label htmlFor="category">Default Category (Optional)</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger id="category" className="mt-1">
                <SelectValue placeholder="Select a category (or leave blank)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No default category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-500 mt-1">
              All imported items will be assigned to this category if no category column is mapped
            </p>
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="file">CSV File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="mt-1"
            />
            {file && (
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => router.push('/vault')}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  Upload & Parse
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {step === 2 && parseResult && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Step 2: Map Columns
            </h2>
            <p className="text-slate-600">
              Review and adjust the column mapping. We've automatically suggested mappings based on your column names.
            </p>
          </div>

          <div className="space-y-4">
            {parseResult.headers.map((header) => (
              <div key={header} className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <Label className="text-slate-700">{header}</Label>
                  <p className="text-sm text-slate-500 mt-1">
                    Example: {parseResult.rows[0]?.data[header] || 'N/A'}
                  </p>
                </div>
                <Select
                  value={columnMapping[header] || ''}
                  onValueChange={(value) =>
                    setColumnMapping((prev) => ({
                      ...prev,
                      [header]: value || null,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ignore column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ignore column</SelectItem>
                    <SelectItem value="brand">Brand</SelectItem>
                    <SelectItem value="model">Model</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                    <SelectItem value="serialNumber">Serial Number</SelectItem>
                    <SelectItem value="referenceNumber">Reference Number</SelectItem>
                    <SelectItem value="vin">VIN</SelectItem>
                    <SelectItem value="makeModel">Make/Model</SelectItem>
                    <SelectItem value="matchingNumbers">Matching Numbers</SelectItem>
                    <SelectItem value="purchasePrice">Purchase Price</SelectItem>
                    <SelectItem value="purchaseDate">Purchase Date</SelectItem>
                    <SelectItem value="estimatedValue">Estimated Value</SelectItem>
                    <SelectItem value="notes">Notes</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleUpdatePreview}
                disabled={isUploading}
              >
                Update Preview
              </Button>
              <Button
                onClick={() => {
                  handleUpdatePreview();
                  setStep(3);
                }}
                disabled={isUploading}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === 3 && parseResult && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Step 3: Review & Import
            </h2>
            <div className="flex items-center space-x-4">
              <Badge variant="default" className="text-sm">
                Total: {parseResult.totalRows} rows
              </Badge>
              <Badge variant="default" className="bg-green-500 text-sm">
                Valid: {parseResult.validRows} rows
              </Badge>
              {parseResult.invalidRows > 0 && (
                <Badge variant="destructive" className="text-sm">
                  Invalid: {parseResult.invalidRows} rows
                </Badge>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-12">Row</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parseResult.rows.map((row) => (
                    <>
                      <TableRow key={row.rowNumber} className={row.isValid ? '' : 'bg-red-50'}>
                        <TableCell className="font-mono text-sm">{row.rowNumber}</TableCell>
                        <TableCell>
                          {row.isValid ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              {row.errors.filter((e) => e.severity === 'error').length} errors
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{row.mappedData.brand || '-'}</TableCell>
                        <TableCell>{row.mappedData.model || '-'}</TableCell>
                        <TableCell>{row.mappedData.year || '-'}</TableCell>
                        <TableCell>
                          {(row.errors.length > 0 || row.warnings.length > 0) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(row.rowNumber)}
                            >
                              {expandedRows.has(row.rowNumber) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(row.rowNumber) && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-slate-50">
                            <div className="space-y-2 py-2">
                              {row.errors.map((error, idx) => (
                                <Alert key={idx} variant="destructive">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription>
                                    <strong>{error.field}:</strong> {error.message}
                                  </AlertDescription>
                                </Alert>
                              ))}
                              {row.warnings.map((warning, idx) => (
                                <Alert key={`w-${idx}`}>
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription>{warning}</AlertDescription>
                                </Alert>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {parseResult.invalidRows > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {parseResult.invalidRows} rows have errors and will be skipped. Only valid rows will be imported.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleExecute}
              disabled={isExecuting || parseResult.validRows === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  Import {parseResult.validRows} Items
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === 4 && (
        <Card className="p-6 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Import Completed Successfully!
            </h2>
            <p className="text-slate-600">
              Your assets have been imported and are now available in your vault.
            </p>
          </div>

          <div className="flex justify-center space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setStep(1);
                setFile(null);
                setCsvContent('');
                setParseResult(null);
                setColumnMapping({});
                setImportId('');
              }}
            >
              Import Another File
            </Button>
            <Button
              onClick={() => router.push('/vault')}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              Go to Vault
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
