'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  Circle,
  Camera,
  FileText,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Info,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  DocumentRequirement,
  CategoryDocumentRequirements,
} from '@/lib/document-checklist';
import {
  getDocumentRequirements,
  calculateProgress,
  getNextRecommendedDocument,
} from '@/lib/document-checklist';

interface DocumentChecklistProps {
  categorySlug: string;
  uploadedDocumentIds: string[];
  onDocumentSelect?: (documentId: string) => void;
  onCameraCapture?: (documentId: string) => void;
  compact?: boolean;
}

export function DocumentChecklist({
  categorySlug,
  uploadedDocumentIds,
  onDocumentSelect,
  onCameraCapture,
  compact = false,
}: DocumentChecklistProps) {
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  
  const requirements = getDocumentRequirements(categorySlug);
  const progress = calculateProgress(categorySlug, uploadedDocumentIds);
  const nextRecommended = getNextRecommendedDocument(categorySlug, uploadedDocumentIds);

  if (!requirements) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Document requirements not available for this category.
        </AlertDescription>
      </Alert>
    );
  }

  const toggleExpanded = (docId: string) => {
    setExpandedDoc(expandedDoc === docId ? null : docId);
  };

  if (compact) {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Document Checklist</CardTitle>
              <CardDescription className="text-xs">
                {progress.uploaded} of {progress.total} uploaded
              </CardDescription>
            </div>
            <Badge variant={progress.isComplete ? "default" : "outline"}>
              {progress.requiredUploaded}/{progress.required} required
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress.percentage} className="h-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-yellow-600" />
              Document Checklist
            </CardTitle>
            <CardDescription className="mt-1">
              {requirements.categoryName} documentation requirements
            </CardDescription>
          </div>
          <Badge 
            variant={progress.isComplete ? "default" : "outline"}
            className={cn(
              "text-sm",
              progress.isComplete && "bg-green-500 hover:bg-green-600"
            )}
          >
            {progress.requiredUploaded}/{progress.required} required
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Upload Progress</span>
            <span className="font-medium text-slate-900">
              {progress.uploaded}/{progress.total} documents
            </span>
          </div>
          <Progress 
            value={progress.percentage} 
            className="h-3"
          />
          <p className="text-xs text-slate-500">
            {progress.percentage}% complete
          </p>
        </div>

        <Separator />

        {/* Next Recommended */}
        {nextRecommended && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Sparkles className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm">
              <strong>Next:</strong> {nextRecommended.name}
              {nextRecommended.required && (
                <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Document List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-900">Required Documents</h4>
          {requirements.documents.map((doc) => {
            const isUploaded = uploadedDocumentIds.includes(doc.id);
            const isExpanded = expandedDoc === doc.id;
            const isNext = nextRecommended?.id === doc.id;

            return (
              <div
                key={doc.id}
                className={cn(
                  "border rounded-lg transition-all",
                  isUploaded ? "border-green-200 bg-green-50" : "border-slate-200 bg-white",
                  isNext && !isUploaded && "border-yellow-300 bg-yellow-50 shadow-sm"
                )}
              >
                {/* Document Header */}
                <div
                  className="p-3 flex items-start justify-between cursor-pointer hover:bg-slate-50/50"
                  onClick={() => toggleExpanded(doc.id)}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      {isUploaded ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-sm font-medium text-slate-900">
                          {doc.name}
                        </h5>
                        {doc.required && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                        {isNext && !isUploaded && (
                          <Badge className="text-xs bg-yellow-500 hover:bg-yellow-600">Next</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {doc.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t">
                    {/* Examples */}
                    {doc.examples && doc.examples.length > 0 && (
                      <div className="pt-3">
                        <p className="text-xs font-medium text-slate-700 mb-1.5">What to include:</p>
                        <ul className="text-xs text-slate-600 space-y-1">
                          {doc.examples.map((example, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-yellow-600 mt-0.5">•</span>
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Capture Guide */}
                    {doc.captureGuide && (
                      <div className="space-y-2">
                        {doc.captureGuide.angles && doc.captureGuide.angles.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-slate-700 mb-1.5">Recommended angles:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {doc.captureGuide.angles.map((angle, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {angle}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {doc.captureGuide.tips && doc.captureGuide.tips.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-slate-700 mb-1.5">Pro tips:</p>
                            <ul className="text-xs text-slate-600 space-y-1">
                              {doc.captureGuide.tips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-600 mt-0.5">✓</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {!isUploaded && (
                      <div className="flex gap-2 pt-2">
                        {onCameraCapture && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCameraCapture(doc.id);
                            }}
                          >
                            <Camera className="h-4 w-4 mr-1.5" />
                            Capture
                          </Button>
                        )}
                        {onDocumentSelect && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDocumentSelect(doc.id);
                            }}
                          >
                            <ImageIcon className="h-4 w-4 mr-1.5" />
                            Upload
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Completion Message */}
        {progress.isComplete && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-800">
              All required documents uploaded! You can still add optional documents for better provenance.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
