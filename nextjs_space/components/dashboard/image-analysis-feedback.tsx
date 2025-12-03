'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  Check,
  X,
  Edit3,
  Star,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExtractedData } from '@/lib/smart-upload';

interface ImageAnalysisFeedbackProps {
  extracted: ExtractedData;
  onConfirm: (data: Partial<ExtractedData>) => void;
  onEdit: (field: string, value: string) => void;
  loading?: boolean;
}

export function ImageAnalysisFeedback({
  extracted,
  onConfirm,
  onEdit,
  loading = false,
}: ImageAnalysisFeedbackProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [showDetails, setShowDetails] = useState(false);

  const hasExtractedData =
    extracted.brand ||
    extracted.model ||
    extracted.serialNumber ||
    extracted.referenceNumber ||
    extracted.year;

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
            <CardTitle className="text-base">Analyzing Image...</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Using AI to extract information from your photo...</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasExtractedData) {
    return (
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-base">No Data Detected</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            We couldn't extract information from this image. You can still fill in the details manually.
          </p>
          {extracted.text.length > 0 && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="gap-2"
              >
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                View Detected Text
              </Button>
              {showDetails && (
                <div className="mt-2 text-xs text-slate-500 bg-white p-3 rounded border">
                  {extracted.text.slice(0, 5).map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const renderConfidenceStars = (confidence?: number) => {
    if (!confidence) return null;
    const stars = Math.round(confidence / 20); // Convert to 0-5 scale
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-3 w-3',
              i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
            )}
          />
        ))}
        <span className="text-xs text-slate-500 ml-1">{confidence}%</span>
      </div>
    );
  };

  const renderField = (label: string, value: string | number | undefined, confidence?: number, fieldKey?: string) => {
    if (!value) return null;

    const isEditing = editingField === fieldKey;
    const editValue = editValues[fieldKey || ''] || String(value);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          {renderConfidenceStars(confidence)}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Input
                value={editValue}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [fieldKey || '']: e.target.value }))
                }
                className="flex-1"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (fieldKey) {
                    onEdit(fieldKey, editValue);
                  }
                  setEditingField(null);
                }}
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingField(null);
                  setEditValues((prev) => {
                    const newValues = { ...prev };
                    delete newValues[fieldKey || ''];
                    return newValues;
                  });
                }}
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex-1 p-2 bg-white rounded border border-slate-200">
                <span className="text-sm font-medium text-slate-900">{value}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingField(fieldKey || null);
                  setEditValues((prev) => ({ ...prev, [fieldKey || '']: String(value) }));
                }}
              >
                <Edit3 className="h-4 w-4 text-slate-600" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base">AI Extracted Information</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            ✨ Smart Upload
          </Badge>
        </div>
        <CardDescription>Review and confirm the extracted information below</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderField('Brand', extracted.brand, extracted.confidence.brand, 'brand')}
        {renderField('Model', extracted.model, extracted.confidence.model, 'model')}
        {renderField(
          'Serial Number',
          extracted.serialNumber,
          extracted.confidence.serialNumber,
          'serialNumber'
        )}
        {renderField(
          'Reference Number',
          extracted.referenceNumber,
          extracted.confidence.referenceNumber,
          'referenceNumber'
        )}
        {renderField('Year', extracted.year, extracted.confidence.year, 'year')}

        <Separator className="my-4" />

        <div className="flex gap-2">
          <Button
            onClick={() => {
              // Pass current (potentially edited) values
              const dataToConfirm: Partial<ExtractedData> = {};
              if (extracted.brand) dataToConfirm.brand = editValues.brand || extracted.brand;
              if (extracted.model) dataToConfirm.model = editValues.model || extracted.model;
              if (extracted.serialNumber)
                dataToConfirm.serialNumber = editValues.serialNumber || extracted.serialNumber;
              if (extracted.referenceNumber)
                dataToConfirm.referenceNumber =
                  editValues.referenceNumber || extracted.referenceNumber;
              if (extracted.year)
                dataToConfirm.year = parseInt(editValues.year || String(extracted.year), 10);
              onConfirm(dataToConfirm);
            }}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirm & Auto-Fill
          </Button>
        </div>

        {(extracted.logos.length > 0 || extracted.labels.length > 0) && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="gap-2"
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              View AI Detection Details
            </Button>
            {showDetails && (
              <div className="mt-3 space-y-3 text-xs text-slate-600 bg-white p-3 rounded border">
                {extracted.logos.length > 0 && (
                  <div>
                    <div className="font-semibold mb-1">Detected Logos:</div>
                    <div className="flex flex-wrap gap-1">
                      {extracted.logos.map((logo, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {logo.description} ({Math.round(logo.score * 100)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {extracted.labels.length > 0 && (
                  <div>
                    <div className="font-semibold mb-1">Detected Labels:</div>
                    <div className="flex flex-wrap gap-1">
                      {extracted.labels.slice(0, 10).map((label, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
