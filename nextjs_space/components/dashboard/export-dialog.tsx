'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  FileText,
  Table,
  DollarSign,
  Loader2,
  Check,
  FileSpreadsheet,
} from 'lucide-react';

interface ExportDialogProps {
  categoryFilter?: string;
  statusFilter?: string;
  totalItems: number;
}

export function ExportDialog({
  categoryFilter,
  statusFilter,
  totalItems,
}: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState<
    'csv-full' | 'csv-summary' | 'pdf-collection' | 'pdf-portfolio'
  >('csv-full');
  const [includeFinancials, setIncludeFinancials] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const exportOptions = [
    {
      id: 'csv-full',
      title: 'Full CSV Export',
      description: 'Complete asset list with all details',
      icon: FileSpreadsheet,
      format: 'CSV',
    },
    {
      id: 'csv-summary',
      title: 'Portfolio Summary CSV',
      description: 'Aggregated data by category',
      icon: Table,
      format: 'CSV',
    },
    {
      id: 'pdf-collection',
      title: 'Collection Report PDF',
      description: 'Comprehensive portfolio overview',
      icon: FileText,
      format: 'PDF',
    },
    {
      id: 'pdf-portfolio',
      title: 'Portfolio Value Report PDF',
      description: 'Financial summary for insurance/appraisals',
      icon: DollarSign,
      format: 'PDF',
    },
  ];

  const handleExport = async () => {
    setIsDownloading(true);

    try {
      let url = '';
      const params = new URLSearchParams();

      // Add filters
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);

      switch (exportType) {
        case 'csv-full':
          params.append('type', 'full');
          if (!includeFinancials) params.append('financials', 'false');
          url = `/api/reports/export?${params.toString()}`;
          break;
        case 'csv-summary':
          params.append('type', 'summary');
          url = `/api/reports/export?${params.toString()}`;
          break;
        case 'pdf-collection':
          url = `/api/reports/collection?${params.toString()}`;
          break;
        case 'pdf-portfolio':
          url = `/api/reports/portfolio-value?${params.toString()}`;
          break;
      }

      // Fetch the file
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'export';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: 'Export Successful',
        description: `Your ${exportOptions.find((opt) => opt.id === exportType)?.format} export is ready.`,
      });

      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'There was an error generating your export. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const selectedOption = exportOptions.find((opt) => opt.id === exportType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export / Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export & Reports</DialogTitle>
          <DialogDescription>
            Generate reports and export your vault data in various formats.
            {(categoryFilter || statusFilter) && (
              <span className="block mt-2 text-sm text-blue-600">
                Current filters will be applied to the export.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Type Selection */}
          <RadioGroup
            value={exportType}
            onValueChange={(value: any) => setExportType(value)}
            className="space-y-3"
          >
            {exportOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card
                  key={option.id}
                  className={`p-4 cursor-pointer transition-all hover:border-blue-500 ${
                    exportType === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                  onClick={() => setExportType(option.id as any)}
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem
                      value={option.id}
                      id={option.id}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <Label
                          htmlFor={option.id}
                          className="font-medium cursor-pointer"
                        >
                          {option.title}
                        </Label>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {option.format}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </p>
                    </div>
                    {exportType === option.id && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </Card>
              );
            })}
          </RadioGroup>

          {/* Additional Options */}
          {exportType === 'csv-full' && (
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-medium">Export Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="financials"
                  checked={includeFinancials}
                  onCheckedChange={(checked) =>
                    setIncludeFinancials(checked as boolean)
                  }
                />
                <Label
                  htmlFor="financials"
                  className="text-sm font-normal cursor-pointer"
                >
                  Include financial data (purchase price, estimated value)
                </Label>
              </div>
            </div>
          )}

          {/* Export Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Assets to export:</span>
              <span className="font-medium">{totalItems}</span>
            </div>
            {selectedOption && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Format:</span>
                <span className="font-medium">{selectedOption.format}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDownloading}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isDownloading}>
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
