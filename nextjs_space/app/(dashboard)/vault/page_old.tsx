'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, Filter, Package, FileImage, Clock, ImageIcon } from 'lucide-react';
import type { AssetCategory, AssetWithDetails } from '@/lib/types';
import { ExportDialog } from '@/components/dashboard/export-dialog';

export default function VaultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession() || {};
  const [items, setItems] = useState<AssetWithDetails[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize filters from URL parameters immediately
  const initialFilters = {
    categoryId: searchParams?.get('category') || 'all',
    status: searchParams?.get('status') || 'all',
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc'
  };
  
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, [filters]);

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

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.categoryId && filters.categoryId !== 'all') {
        params.append('categoryId', filters.categoryId);
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.searchQuery) {
        params.append('search', filters.searchQuery);
      }
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      const res = await fetch(`/api/items?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending Review', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      verified: { label: 'Verified', className: 'bg-green-50 text-green-700 border-green-200' },
      flagged: { label: 'Flagged', className: 'bg-red-50 text-red-700 border-red-200' },
      rejected: { label: 'Rejected', className: 'bg-gray-50 text-gray-700 border-gray-200' },
    };

    const variant = variants[status] || variants.pending;
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">My Vault</h1>
          <p className="text-muted-foreground mt-1">
            Manage your luxury asset collection
          </p>
        </div>
        <Button asChild>
          <Link href="/vault/add-asset">
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search assets..."
                  className="pl-10"
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filters.categoryId} onValueChange={(value) => handleFilterChange('categoryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date Added</SelectItem>
                  <SelectItem value="value">Estimated Value</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Header with Export */}
      {!loading && items.length > 0 && (
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{items.length}</span> {items.length === 1 ? 'asset' : 'assets'}
            {(filters.categoryId !== 'all' || filters.status !== 'all' || filters.searchQuery) && (
              <span className="ml-1">(filtered)</span>
            )}
          </div>
          <ExportDialog
            categoryFilter={filters.categoryId !== 'all' ? filters.categoryId : undefined}
            statusFilter={filters.status !== 'all' ? filters.status : undefined}
            totalItems={items.length}
          />
        </div>
      )}

      {/* Items Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filters.searchQuery || filters.categoryId !== 'all' || filters.status !== 'all'
                ? 'No items found'
                : 'No assets yet'}
            </h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              {filters.searchQuery || filters.categoryId !== 'all' || filters.status !== 'all'
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'Start building your luxury asset vault by adding your first item.'}
            </p>
            {!filters.searchQuery && filters.categoryId === 'all' && filters.status === 'all' && (
              <Button asChild>
                <Link href="/vault/add-asset">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Asset
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden" onClick={() => router.push(`/vault/${item.id}`)}>
              {/* Thumbnail Image */}
              <div className="relative w-full aspect-video bg-gray-100">
                {item.mediaAssets && item.mediaAssets.length > 0 ? (
                  <Image
                    src={item.mediaAssets[0].cloudStoragePath}
                    alt={`${item.brand || ''} ${item.model || 'Asset'}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy-100 to-gray-100">
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline">{item.category.name}</Badge>
                  {getStatusBadge(item.status)}
                </div>
                <CardTitle className="text-xl">
                  {item.brand && item.model ? `${item.brand} ${item.model}` : item.brand || item.model || 'Untitled Asset'}
                </CardTitle>
                {item.year && (
                  <CardDescription>Year: {item.year}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {item.makeModel && (
                    <div className="text-sm">
                      <span className="text-gray-500">Make/Model:</span>
                      <span className="ml-2 font-medium">{item.makeModel}</span>
                    </div>
                  )}
                  {item.vin && (
                    <div className="text-sm">
                      <span className="text-gray-500">VIN:</span>
                      <span className="ml-2 font-mono text-xs">{item.vin}</span>
                    </div>
                  )}
                  {item.serialNumber && (
                    <div className="text-sm">
                      <span className="text-gray-500">Serial:</span>
                      <span className="ml-2 font-mono text-xs">{item.serialNumber}</span>
                    </div>
                  )}
                  {item.estimatedValue && (
                    <div className="text-sm">
                      <span className="text-gray-500">Est. Value:</span>
                      <span className="ml-2 font-semibold text-green-600">
                        ${parseFloat(item.estimatedValue.toString()).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {item.matchingNumbers && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Matching Numbers
                    </Badge>
                  )}
                  <div className="flex gap-4 pt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileImage className="h-3 w-3" />
                      {item._count?.mediaAssets || 0} files
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item._count?.provenanceEvents || 0} events
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
