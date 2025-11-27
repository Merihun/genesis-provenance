import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

export default function VaultPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-serif" style={{ fontFamily: 'var(--font-playfair)' }}>
            My Vault
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your luxury asset provenance records
          </p>
        </div>
        <Button className="bg-blue-900 hover:bg-blue-800">
          <Package className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="py-16">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-gray-900">
              No items yet
            </h3>
            <p className="mt-2 text-gray-600 max-w-sm mx-auto">
              Add your first luxury asset to get started. Upload photos, documents, and metadata to create a verified provenance record.
            </p>
            <div className="mt-8">
              <Button className="bg-blue-900 hover:bg-blue-800" size="lg">
                <Package className="mr-2 h-5 w-5" />
                Add Your First Asset
              </Button>
            </div>
            <div className="mt-6 text-sm text-gray-500">
              <p>Asset onboarding wizard coming in Phase 2</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
