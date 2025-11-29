'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, Package } from 'lucide-react';

export default function AddAssetPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const handleStartOnboarding = () => {
    toast({
      title: 'Coming in Phase 2',
      description: 'The asset onboarding wizard with file uploads will be available soon. Stay tuned!',
    });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Button
        variant="ghost"
        onClick={() => router.push('/vault')}
        className="mb-4"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Vault
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            Add New Luxury Asset
          </CardTitle>
          <CardDescription>
            Create a verified provenance record for your luxury item
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Coming Soon Message */}
          <div className="text-center py-12 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 mb-6">
              <Package className="h-10 w-10 text-blue-900" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Asset Onboarding Coming Soon!</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              We're building a comprehensive asset onboarding wizard with:
            </p>
            <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700 mb-8">
              <li className="flex items-start">
                <span className="text-blue-900 mr-2">✓</span>
                Multi-step form for detailed asset information
              </li>
              <li className="flex items-start">
                <span className="text-blue-900 mr-2">✓</span>
                Multiple photo uploads with image galleries
              </li>
              <li className="flex items-start">
                <span className="text-blue-900 mr-2">✓</span>
                Document uploads (receipts, certificates, appraisals)
              </li>
              <li className="flex items-start">
                <span className="text-blue-900 mr-2">✓</span>
                AI-powered authenticity analysis
              </li>
              <li className="flex items-start">
                <span className="text-blue-900 mr-2">✓</span>
                Automated provenance record generation
              </li>
            </ul>
            <Button 
              onClick={handleStartOnboarding}
              className="bg-blue-900 hover:bg-blue-800"
              size="lg"
            >
              Get Notified When Available
            </Button>
          </div>

          {/* Preview of Form Fields */}
          <div className="space-y-6 opacity-50 pointer-events-none">
            <div>
              <h4 className="text-lg font-semibold mb-4">Preview: Basic Information</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Category</Label>
                  <Input placeholder="Watch, Handbag, Jewelry, Art..." disabled />
                </div>
                <div>
                  <Label>Brand</Label>
                  <Input placeholder="e.g., Rolex, Hermès" disabled />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input placeholder="e.g., Submariner, Birkin" disabled />
                </div>
                <div>
                  <Label>Serial Number</Label>
                  <Input placeholder="e.g., Y123456" disabled />
                </div>
              </div>
            </div>
            <div>
              <Label>Additional Notes</Label>
              <Textarea 
                placeholder="Provide any additional details about the asset's history, condition, or provenance..."
                rows={4}
                disabled
              />
            </div>
          </div>

          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Phase 2 is coming soon!</strong> This full-featured asset onboarding wizard will be available in the next update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
