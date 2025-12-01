'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronRight, ChevronLeft, Upload, X, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AssetCategory } from '@/lib/types';

export default function AddAssetPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    categoryId: '',
    brand: '',
    model: '',
    year: '',
    referenceNumber: '',
    serialNumber: '',
    vin: '',
    makeModel: '',
    matchingNumbers: false,
    purchaseDate: '',
    purchasePrice: '',
    estimatedValue: '',
    notes: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedCategory = categories.find(c => c.id === formData.categoryId);
  const isLuxuryCar = selectedCategory?.slug === 'luxury-car';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Create the item
      const itemPayload = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : undefined,
      };
      
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.details || 'Failed to create item');
      }

      const { item } = await res.json();

      // Upload files if any
      if (files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'photo');

          const mediaRes = await fetch(`/api/items/${item.id}/media`, {
            method: 'POST',
            body: formData,
          });

          if (!mediaRes.ok) {
            console.error('Failed to upload media file:', file.name);
          }
        }
      }

      toast({
        title: 'Success!',
        description: 'Your asset has been registered successfully.',
      });

      router.push(`/vault/${item.id}`);
    } catch (error) {
      console.error('Error creating item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to register asset. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    if (step === 1) return formData.categoryId !== '';
    if (step === 2) {
      return formData.brand !== '' || formData.model !== '';
    }
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy-900">Add New Asset</h1>
        <p className="text-muted-foreground mt-2">
          Register your luxury asset for authentication and provenance tracking
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              step >= i ? 'bg-primary border-primary text-white' : 'border-gray-300 text-gray-400'
            }`}>
              {step > i ? <CheckCircle2 className="w-5 h-5" /> : i}
            </div>
            {i < 4 && (
              <div className={`flex-1 h-1 mx-2 ${
                step > i ? 'bg-primary' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && 'Select Category'}
            {step === 2 && 'Asset Details'}
            {step === 3 && 'Upload Media'}
            {step === 4 && 'Review & Submit'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Choose the type of luxury asset you want to register'}
            {step === 2 && 'Provide detailed information about your asset'}
            {step === 3 && 'Upload photos and documents (optional)'}
            {step === 4 && 'Review your information before submitting'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Category Selection */}
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleChange('categoryId', category.id)}
                  className={`p-6 border-2 rounded-lg text-center transition-all ${
                    formData.categoryId === category.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg font-semibold">{category.name}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Asset Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand / Maker *</Label>
                  <Input
                    id="brand"
                    placeholder={isLuxuryCar ? "e.g., Ferrari" : "e.g., Rolex"}
                    value={formData.brand}
                    onChange={(e) => handleChange('brand', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    placeholder={isLuxuryCar ? "e.g., 275 GTB/4" : "e.g., Submariner"}
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="1967"
                    value={formData.year}
                    onChange={(e) => handleChange('year', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    placeholder="Ref. no."
                    value={formData.referenceNumber}
                    onChange={(e) => handleChange('referenceNumber', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    placeholder="Serial no."
                    value={formData.serialNumber}
                    onChange={(e) => handleChange('serialNumber', e.target.value)}
                  />
                </div>
              </div>

              {isLuxuryCar && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="vin">VIN (Vehicle Identification Number)</Label>
                    <Input
                      id="vin"
                      placeholder="17-character VIN"
                      maxLength={17}
                      value={formData.vin}
                      onChange={(e) => handleChange('vin', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="makeModel">Full Make/Model</Label>
                    <Input
                      id="makeModel"
                      placeholder="e.g., Ferrari 275 GTB/4"
                      value={formData.makeModel}
                      onChange={(e) => handleChange('makeModel', e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="matchingNumbers"
                      checked={formData.matchingNumbers}
                      onCheckedChange={(checked) => handleChange('matchingNumbers', checked)}
                    />
                    <Label htmlFor="matchingNumbers" className="cursor-pointer">
                      Matching Numbers (Engine/Chassis verified)
                    </Label>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleChange('purchaseDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    placeholder="0.00"
                    value={formData.purchasePrice}
                    onChange={(e) => handleChange('purchasePrice', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedValue">Current Estimated Value ($)</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  placeholder="0.00"
                  value={formData.estimatedValue}
                  onChange={(e) => handleChange('estimatedValue', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional details, provenance information, or special features..."
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Upload Media */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-primary hover:text-primary/80 font-semibold">
                    Click to upload
                  </span>
                  {' '}or drag and drop
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  PNG, JPG, PDF up to 10MB
                </p>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files ({files.length})</Label>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <div className="font-medium">{file.name}</div>
                          <div className="text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-500">Category</Label>
                  <div className="mt-1">{selectedCategory?.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Brand</Label>
                    <div className="mt-1">{formData.brand || '-'}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500">Model</Label>
                    <div className="mt-1">{formData.model || '-'}</div>
                  </div>
                </div>
                {formData.year && (
                  <div>
                    <Label className="text-gray-500">Year</Label>
                    <div className="mt-1">{formData.year}</div>
                  </div>
                )}
                {formData.vin && (
                  <div>
                    <Label className="text-gray-500">VIN</Label>
                    <div className="mt-1 font-mono">{formData.vin}</div>
                  </div>
                )}
                {formData.matchingNumbers && (
                  <div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Matching Numbers Verified
                    </Badge>
                  </div>
                )}
                {(formData.purchasePrice || formData.estimatedValue) && (
                  <div className="grid grid-cols-2 gap-4">
                    {formData.purchasePrice && (
                      <div>
                        <Label className="text-gray-500">Purchase Price</Label>
                        <div className="mt-1">${parseFloat(formData.purchasePrice).toLocaleString()}</div>
                      </div>
                    )}
                    {formData.estimatedValue && (
                      <div>
                        <Label className="text-gray-500">Estimated Value</Label>
                        <div className="mt-1">${parseFloat(formData.estimatedValue).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                )}
                {files.length > 0 && (
                  <div>
                    <Label className="text-gray-500">Media Files</Label>
                    <div className="mt-1">{files.length} file(s) ready to upload</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(s => s - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            
            <div className="flex-1" />

            {step < 4 ? (
              <Button
                type="button"
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Register Asset'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
