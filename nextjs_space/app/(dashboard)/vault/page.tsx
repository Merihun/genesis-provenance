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
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Plus, Search, Filter, Package, FileImage, Clock, ImageIcon,
  ChevronDown, ChevronUp, Save, Star, Trash2, CheckSquare, XSquare,
  TrendingUp, Calendar, CheckCircle2, AlertTriangle, Sparkles, FolderOpen, Upload
} from 'lucide-react';
import type { AssetCategory, AssetWithDetails } from '@/lib/types';
import { ExportDialog } from '@/components/dashboard/export-dialog';

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: any;
  isDefault: boolean;
}

interface SmartCollection {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
  filters: any;
}

export default function VaultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  
  const [items, setItems] = useState<AssetWithDetails[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [smartCollections, setSmartCollections] = useState<SmartCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSaveSearchDialog, setShowSaveSearchDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [saveSearchDescription, setSaveSearchDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  
  // Define initial filter state
  const initialFilters = {
    categoryId: 'all',
    status: 'all',
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc',
    purchaseDateFrom: '',
    purchaseDateTo: '',
    createdAtFrom: '',
    createdAtTo: '',
    minPurchasePrice: '',
    maxPurchasePrice: '',
    minEstimatedValue: '',
    maxEstimatedValue: '',
  };
  
  // Initialize filters from URL parameters
  const [filters, setFilters] = useState({
    categoryId: searchParams?.get('category') || 'all',
    status: searchParams?.get('status') || 'all',
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc',
    // Advanced filters
    purchaseDateFrom: '',
    purchaseDateTo: '',
    createdAtFrom: '',
    createdAtTo: '',
    minPurchasePrice: '',
    maxPurchasePrice: '',
    minEstimatedValue: '',
    maxEstimatedValue: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchSavedSearches();
    fetchSmartCollections();
  }, []);

  useEffect(() => {
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

  const fetchSavedSearches = async () => {
    try {
      const res = await fetch('/api/saved-searches');
      if (res.ok) {
        const data = await res.json();
        setSavedSearches(data.savedSearches);
      }
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    }
  };

  const fetchSmartCollections = async () => {
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const data = await res.json();
        setSmartCollections(data.collections);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
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
      
      // Advanced filters
      if (filters.purchaseDateFrom) params.append('purchaseDateFrom', filters.purchaseDateFrom);
      if (filters.purchaseDateTo) params.append('purchaseDateTo', filters.purchaseDateTo);
      if (filters.createdAtFrom) params.append('createdAtFrom', filters.createdAtFrom);
      if (filters.createdAtTo) params.append('createdAtTo', filters.createdAtTo);
      if (filters.minPurchasePrice) params.append('minPurchasePrice', filters.minPurchasePrice);
      if (filters.maxPurchasePrice) params.append('maxPurchasePrice', filters.maxPurchasePrice);
      if (filters.minEstimatedValue) params.append('minEstimatedValue', filters.minEstimatedValue);
      if (filters.maxEstimatedValue) params.append('maxEstimatedValue', filters.maxEstimatedValue);
      
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

  const handleLoadSavedSearch = (savedSearch: SavedSearch) => {
    setFilters(prev => ({
      ...prev,
      ...savedSearch.filters,
    }));
    toast({
      title: 'Search loaded',
      description: `Loaded "${savedSearch.name}"`,
    });
  };

  const handleLoadCollection = (collection: SmartCollection) => {
    // Map collection filters to vault filter format
    const collectionFilters = collection.filters;
    const mappedFilters: any = { ...initialFilters };
    
    // Handle status filter (collections use 'statuses' array, vault uses 'status' string)
    if (collectionFilters.statuses && Array.isArray(collectionFilters.statuses) && collectionFilters.statuses.length > 0) {
      mappedFilters.status = collectionFilters.statuses[0];
    }
    
    // Handle other filters
    if (collectionFilters.minEstimatedValue) {
      mappedFilters.minEstimatedValue = collectionFilters.minEstimatedValue.toString();
    }
    if (collectionFilters.createdAtFrom) {
      mappedFilters.createdAtFrom = collectionFilters.createdAtFrom.split('T')[0];
    }
    
    setFilters(mappedFilters);
    toast({
      title: 'Collection loaded',
      description: `Viewing "${collection.name}"`,
    });
  };

  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the search',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveSearchName,
          description: saveSearchDescription,
          filters: {
            search: filters.searchQuery,
            categories: filters.categoryId !== 'all' ? [filters.categoryId] : [],
            statuses: filters.status !== 'all' ? [filters.status] : [],
            purchaseDateFrom: filters.purchaseDateFrom,
            purchaseDateTo: filters.purchaseDateTo,
            createdAtFrom: filters.createdAtFrom,
            createdAtTo: filters.createdAtTo,
            minPurchasePrice: filters.minPurchasePrice ? parseFloat(filters.minPurchasePrice) : undefined,
            maxPurchasePrice: filters.maxPurchasePrice ? parseFloat(filters.maxPurchasePrice) : undefined,
            minEstimatedValue: filters.minEstimatedValue ? parseFloat(filters.minEstimatedValue) : undefined,
            maxEstimatedValue: filters.maxEstimatedValue ? parseFloat(filters.maxEstimatedValue) : undefined,
          },
          isDefault: false,
        }),
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Search saved successfully',
        });
        setShowSaveSearchDialog(false);
        setSaveSearchName('');
        setSaveSearchDescription('');
        fetchSavedSearches();
      } else {
        throw new Error('Failed to save search');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save search',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSavedSearch = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-searches/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Search deleted successfully',
        });
        fetchSavedSearches();
      } else {
        throw new Error('Failed to delete search');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete search',
        variant: 'destructive',
      });
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleBulkAction = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one item',
        variant: 'destructive',
      });
      return;
    }

    if (!bulkAction) {
      toast({
        title: 'Error',
        description: 'Please select an action',
        variant: 'destructive',
      });
      return;
    }

    if (bulkAction === 'update_status' && !bulkStatus) {
      toast({
        title: 'Error',
        description: 'Please select a status',
        variant: 'destructive',
      });
      return;
    }

    setIsBulkUpdating(true);
    try {
      const res = await fetch('/api/items/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemIds: Array.from(selectedItems),
          action: bulkAction,
          status: bulkAction === 'update_status' ? bulkStatus : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: 'Success',
          description: data.message,
        });
        setSelectedItems(new Set());
        setBulkAction('');
        setBulkStatus('');
        fetchItems();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to perform bulk action');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to perform bulk action',
        variant: 'destructive',
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const clearFilters = () => {
    setFilters(initialFilters);
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

  const getCollectionIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      TrendingUp,
      Clock,
      Calendar,
      CheckCircle2,
      AlertTriangle,
      Sparkles,
    };
    const Icon = icons[iconName] || FolderOpen;
    return <Icon className="h-4 w-4" />;
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Vault</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your luxury assets
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/vault/add-asset">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </Link>
          <Link href="/vault/bulk-import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Smart Collections & Saved Searches */}
        <div className="lg:col-span-1 space-y-4">
          {/* Smart Collections */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Collections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {smartCollections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleLoadCollection(collection)}
                  className="w-full flex items-center justify-between p-2 hover:bg-muted rounded-md transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    {getCollectionIcon(collection.icon)}
                    <span className="text-sm">{collection.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {collection.count}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Saved Searches */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Saved Searches</CardTitle>
                <Dialog open={showSaveSearchDialog} onOpenChange={setShowSaveSearchDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Save className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Current Search</DialogTitle>
                      <DialogDescription>
                        Save your current filters to quickly access them later
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="search-name">Name</Label>
                        <Input
                          id="search-name"
                          value={saveSearchName}
                          onChange={(e) => setSaveSearchName(e.target.value)}
                          placeholder="e.g., High-Value Watches"
                        />
                      </div>
                      <div>
                        <Label htmlFor="search-description">Description (optional)</Label>
                        <Input
                          id="search-description"
                          value={saveSearchDescription}
                          onChange={(e) => setSaveSearchDescription(e.target.value)}
                          placeholder="Brief description of this search"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowSaveSearchDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveSearch} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Search
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {savedSearches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No saved searches yet
                </p>
              ) : (
                savedSearches.map((search) => (
                  <div
                    key={search.id}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-md group"
                  >
                    <button
                      onClick={() => handleLoadSavedSearch(search)}
                      className="flex-1 text-left flex items-center gap-2"
                    >
                      {search.isDefault && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                      <span className="text-sm">{search.name}</span>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteSavedSearch(search.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Search & Items */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search and Filter Controls */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search assets by brand, model, serial number..."
                      value={filters.searchQuery}
                      onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {showAdvancedFilters ? 'Hide' : 'Show'} Filters
                  {showAdvancedFilters ? (
                    <ChevronUp className="ml-2 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>

            {showAdvancedFilters && (
              <CardContent className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category-filter">Category</Label>
                    <Select value={filters.categoryId} onValueChange={(value) => handleFilterChange('categoryId', value)}>
                      <SelectTrigger id="category-filter">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status-filter">Status</Label>
                    <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                      <SelectTrigger id="status-filter">
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

                  <div>
                    <Label htmlFor="sort-filter">Sort By</Label>
                    <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                      <SelectTrigger id="sort-filter">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date Added</SelectItem>
                        <SelectItem value="value">Estimated Value</SelectItem>
                        <SelectItem value="brand">Brand</SelectItem>
                        <SelectItem value="purchaseDate">Purchase Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Date Range Filters */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Purchase Date Range</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="purchase-from" className="text-xs">From</Label>
                      <Input
                        id="purchase-from"
                        type="date"
                        value={filters.purchaseDateFrom}
                        onChange={(e) => handleFilterChange('purchaseDateFrom', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="purchase-to" className="text-xs">To</Label>
                      <Input
                        id="purchase-to"
                        type="date"
                        value={filters.purchaseDateTo}
                        onChange={(e) => handleFilterChange('purchaseDateTo', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Date Added Range</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="created-from" className="text-xs">From</Label>
                      <Input
                        id="created-from"
                        type="date"
                        value={filters.createdAtFrom}
                        onChange={(e) => handleFilterChange('createdAtFrom', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="created-to" className="text-xs">To</Label>
                      <Input
                        id="created-to"
                        type="date"
                        value={filters.createdAtTo}
                        onChange={(e) => handleFilterChange('createdAtTo', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Value Range Filters */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Purchase Price Range</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min-purchase" className="text-xs">Min</Label>
                      <Input
                        id="min-purchase"
                        type="number"
                        placeholder="0"
                        value={filters.minPurchasePrice}
                        onChange={(e) => handleFilterChange('minPurchasePrice', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-purchase" className="text-xs">Max</Label>
                      <Input
                        id="max-purchase"
                        type="number"
                        placeholder="No limit"
                        value={filters.maxPurchasePrice}
                        onChange={(e) => handleFilterChange('maxPurchasePrice', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Estimated Value Range</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min-value" className="text-xs">Min</Label>
                      <Input
                        id="min-value"
                        type="number"
                        placeholder="0"
                        value={filters.minEstimatedValue}
                        onChange={(e) => handleFilterChange('minEstimatedValue', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-value" className="text-xs">Max</Label>
                      <Input
                        id="max-value"
                        type="number"
                        placeholder="No limit"
                        value={filters.maxEstimatedValue}
                        onChange={(e) => handleFilterChange('maxEstimatedValue', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Bulk Actions Bar */}
          {selectedItems.size > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="py-3">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
                    <Select value={bulkAction} onValueChange={setBulkAction}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="update_status">Update Status</SelectItem>
                        <SelectItem value="delete">Delete Items</SelectItem>
                      </SelectContent>
                    </Select>
                    {bulkAction === 'update_status' && (
                      <Select value={bulkStatus} onValueChange={setBulkStatus}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="flagged">Flagged</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {bulkAction === 'delete' ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" disabled={isBulkUpdating}>
                            {isBulkUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {selectedItems.size} asset{selectedItems.size > 1 ? 's' : ''} and all related data.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkAction}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button onClick={handleBulkAction} disabled={isBulkUpdating || !bulkAction}>
                        {isBulkUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Apply
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => setSelectedItems(new Set())}>
                      <XSquare className="mr-2 h-4 w-4" />
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {loading ? 'Loading...' : `${items.length} asset${items.length !== 1 ? 's' : ''} found`}
              </p>
              {items.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedItems.size === items.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
            {items.length > 0 && (
              <ExportDialog
                categoryFilter={filters.categoryId !== 'all' ? filters.categoryId : undefined}
                statusFilter={filters.status !== 'all' ? filters.status : undefined}
                totalItems={items.length}
              />
            )}
          </div>

          {/* Items Grid */}
          {loading ? (
            // Enhanced Loading State with Skeleton Cards
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="overflow-hidden animate-pulse">
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-navy-900 to-navy-800"></div>
                  <CardContent className="p-5 space-y-3">
                    <div className="space-y-2">
                      <div className="h-5 bg-gradient-to-r from-navy-800 to-navy-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gradient-to-r from-navy-800 to-navy-700 rounded w-1/2"></div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="h-3 bg-gradient-to-r from-navy-800 to-navy-700 rounded w-20"></div>
                      <div className="h-3 bg-gradient-to-r from-navy-800 to-navy-700 rounded w-24"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            // Enhanced Empty State
            <Card className="card-elevated border-0 overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gold-500/10 blur-3xl rounded-full"></div>
                  <div className="relative bg-gradient-to-br from-navy-800 to-navy-900 p-6 rounded-2xl shadow-gold">
                    <Package className="h-16 w-16 text-gold-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gradient">No assets found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {filters.searchQuery || filters.categoryId !== 'all' || filters.status !== 'all' 
                    ? 'No assets match your current filters. Try adjusting your search criteria.'
                    : 'Your vault is empty. Start building your luxury asset collection today.'
                  }
                </p>
                {filters.searchQuery || filters.categoryId !== 'all' || filters.status !== 'all' ? (
                  <Button variant="outline" onClick={clearFilters} className="mb-3">
                    <XSquare className="mr-2 h-4 w-4" />
                    Clear All Filters
                  </Button>
                ) : null}
                <Link href="/vault/add-asset">
                  <Button className="btn-primary shadow-lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Asset
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            // Enhanced Items Grid
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((item: any) => (
                <Card 
                  key={item.id} 
                  className={`card-elevated group overflow-hidden border-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                    selectedItems.has(item.id) 
                      ? 'ring-2 ring-gold-500 shadow-lg shadow-gold-500/20' 
                      : ''
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Image Container with Enhanced Checkbox */}
                    <div className="relative">
                      <div className="absolute top-3 left-3 z-10">
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-1.5 shadow-lg border border-navy-200/20 transition-all duration-200 hover:scale-110">
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => handleSelectItem(item.id)}
                            className="border-2 border-navy-300 data-[state=checked]:bg-gold-500 data-[state=checked]:border-gold-500"
                          />
                        </div>
                      </div>
                      
                      {/* Status Badge Overlay */}
                      <div className="absolute top-3 right-3 z-10">
                        {getStatusBadge(item.status)}
                      </div>
                      
                      <Link href={`/vault/${item.id}`}>
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-navy-900 to-navy-800 overflow-hidden">
                          {item.mediaAssets && item.mediaAssets.length > 0 ? (
                            <>
                              <Image
                                src={item.mediaAssets[0].cloudStoragePath}
                                alt={`${item.brand || ''} ${item.model || 'Asset'}`}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                loading="lazy"
                              />
                              {/* Gradient Overlay on Hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-navy-800/50 to-navy-900/50 backdrop-blur-sm">
                              <div className="bg-navy-800/50 p-4 rounded-full mb-2">
                                <ImageIcon className="h-10 w-10 text-gold-400/50" />
                              </div>
                              <p className="text-xs text-navy-400">No Image</p>
                            </div>
                          )}
                          
                          {/* View Details Overlay - appears on hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                            <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                              <span className="text-sm font-medium text-navy-900">View Details</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                    
                    {/* Enhanced Card Content */}
                    <Link href={`/vault/${item.id}`}>
                      <div className="p-5 space-y-3 bg-gradient-to-br from-white to-navy-50/30">
                        {/* Title & Model */}
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg truncate text-navy-950 group-hover:text-gold-600 transition-colors duration-200">
                            {item.brand || item.makeModel || 'Unnamed Asset'}
                          </h3>
                          {item.model && (
                            <p className="text-sm text-navy-600 truncate font-medium">
                              {item.model}
                            </p>
                          )}
                        </div>
                        
                        {/* Category & Value */}
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-navy-100">
                          <span className="text-navy-500 font-medium capitalize flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-gold-500"></div>
                            {item.category?.name}
                          </span>
                          {item.estimatedValue && (
                            <span className="font-bold text-navy-900 text-base">
                              ${Number(item.estimatedValue).toLocaleString()}
                            </span>
                          )}
                        </div>
                        
                        {/* Meta Information */}
                        <div className="flex items-center gap-4 text-xs text-navy-500 pt-1">
                          {item._count?.mediaAssets > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-navy-100/50 rounded-full">
                              <FileImage className="h-3.5 w-3.5 text-navy-600" />
                              <span className="font-medium">{item._count.mediaAssets}</span>
                            </div>
                          )}
                          {item._count?.provenanceEvents > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-navy-100/50 rounded-full">
                              <Clock className="h-3.5 w-3.5 text-navy-600" />
                              <span className="font-medium">{item._count.provenanceEvents}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
