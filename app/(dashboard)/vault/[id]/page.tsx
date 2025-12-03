'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AIAnalysisSection } from '@/components/dashboard/ai-analysis-section';
import { CommentSection } from '@/components/dashboard/comment-section';
import { ApprovalWorkflow } from '@/components/dashboard/approval-workflow';
import { 
  Loader2, 
  ChevronLeft, 
  Edit, 
  Trash2, 
  Plus, 
  FileImage,
  FileText,
  Calendar,
  DollarSign,
  Shield,
  AlertCircle,
  Upload,
  FileDown,
  Sparkles
} from 'lucide-react';

interface ItemDetails {
  id: string;
  category: { name: string; slug: string };
  brand?: string;
  model?: string;
  year?: number;
  makeModel?: string;
  vin?: string;
  matchingNumbers?: boolean;
  serialNumber?: string;
  referenceNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  estimatedValue?: number;
  status: string;
  riskScore?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { fullName: string; email: string };
  mediaAssets: any[];
  provenanceEvents: any[];
}

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession() || {};
  const { toast } = useToast();
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [eventForm, setEventForm] = useState({
    eventType: 'note_added',
    title: '',
    description: '',
    occurredAt: new Date().toISOString().split('T')[0],
  });

  const [editForm, setEditForm] = useState({
    brand: '',
    model: '',
    year: '',
    serialNumber: '',
    referenceNumber: '',
    vin: '',
    makeModel: '',
    matchingNumbers: false,
    purchaseDate: '',
    purchasePrice: '',
    estimatedValue: '',
    notes: '',
    status: 'pending',
  });

  useEffect(() => {
    if (params.id) {
      fetchItem();
    }
  }, [params.id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/items/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setItem(data.item);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load item details',
          variant: 'destructive',
        });
        router.push('/vault');
      }
    } catch (error) {
      console.error('Error fetching item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!item) return;
    
    // Populate edit form with current item data
    setEditForm({
      brand: item.brand || '',
      model: item.model || '',
      year: item.year?.toString() || '',
      serialNumber: item.serialNumber || '',
      referenceNumber: item.referenceNumber || '',
      vin: item.vin || '',
      makeModel: item.makeModel || '',
      matchingNumbers: item.matchingNumbers || false,
      purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '',
      purchasePrice: item.purchasePrice?.toString() || '',
      estimatedValue: item.estimatedValue?.toString() || '',
      notes: item.notes || '',
      status: item.status || 'pending',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      brand: '',
      model: '',
      year: '',
      serialNumber: '',
      referenceNumber: '',
      vin: '',
      makeModel: '',
      matchingNumbers: false,
      purchaseDate: '',
      purchasePrice: '',
      estimatedValue: '',
      notes: '',
      status: 'pending',
    });
  };

  const handleSaveEdit = async () => {
    try {
      setIsSubmitting(true);

      // Prepare payload
      const payload: any = {
        brand: editForm.brand || undefined,
        model: editForm.model || undefined,
        serialNumber: editForm.serialNumber || undefined,
        referenceNumber: editForm.referenceNumber || undefined,
        vin: editForm.vin || undefined,
        makeModel: editForm.makeModel || undefined,
        matchingNumbers: editForm.matchingNumbers,
        purchaseDate: editForm.purchaseDate || undefined,
        purchasePrice: editForm.purchasePrice || undefined,
        estimatedValue: editForm.estimatedValue || undefined,
        notes: editForm.notes || undefined,
        status: editForm.status,
      };

      // Handle year conversion
      if (editForm.year) {
        const yearNum = parseInt(editForm.year, 10);
        if (!isNaN(yearNum) && yearNum > 0) {
          payload.year = yearNum;
        }
      }

      const res = await fetch(`/api/items/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.details || 'Failed to update item');
      }

      const { item: updatedItem } = await res.json();
      setItem(updatedItem);
      setIsEditing(false);

      toast({
        title: 'Success',
        description: 'Asset updated successfully',
      });
    } catch (error) {
      console.error('Error updating item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update asset. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const res = await fetch(`/api/items/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete item');
      }

      toast({
        title: 'Success',
        description: 'Asset deleted successfully',
      });

      router.push('/vault');
    } catch (error) {
      console.error('Error deleting item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete asset. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleAddEvent = async () => {
    if (!eventForm.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/items/${params.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm),
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Event added successfully',
        });
        setShowAddEventDialog(false);
        setEventForm({
          eventType: 'note_added',
          title: '',
          description: '',
          occurredAt: new Date().toISOString().split('T')[0],
        });
        fetchItem();
      } else {
        throw new Error('Failed to add event');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'photo');

    try {
      const res = await fetch(`/api/items/${params.id}/media`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'File uploaded successfully',
        });
        fetchItem();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      toast({
        title: 'Generating Certificate',
        description: 'Please wait while we generate your certificate...',
      });

      const res = await fetch(`/api/items/${params.id}/certificate`);
      
      if (!res.ok) {
        throw new Error('Failed to generate certificate');
      }

      // Get the filename from the Content-Disposition header if available
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = 'Certificate.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Convert response to blob
      const blob = await res.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Certificate downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download certificate. Please try again.',
        variant: 'destructive',
      });
    }
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

  const getEventIcon = (eventType: string) => {
    const icons: Record<string, any> = {
      registered: Shield,
      reviewed: FileText,
      status_changed: AlertCircle,
      ownership_transfer: Calendar,
      restoration_work: Edit,
      service_record: FileText,
      concours_event: Calendar,
      appraisal: DollarSign,
      inspection: Shield,
      note_added: FileText,
    };
    const Icon = icons[eventType] || FileText;
    return <Icon className="h-5 w-5" />;
  };

  const formatEventType = (eventType: string) => {
    return eventType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/vault')} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Vault
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline">{item.category.name}</Badge>
              {getStatusBadge(item.status)}
              {item.matchingNumbers && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Matching Numbers
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold text-navy-900">
              {item.brand && item.model ? `${item.brand} ${item.model}` : item.brand || item.model || 'Untitled Asset'}
            </h1>
            {item.year && (
              <p className="text-xl text-muted-foreground mt-1">Year: {item.year}</p>
            )}
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <Button onClick={handleDownloadCertificate} className="bg-navy-600 hover:bg-navy-700">
                  <FileDown className="h-4 w-4 mr-2" />
                  Download Certificate
                </Button>
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            {isEditing && (
              <>
                <Button 
                  onClick={handleSaveEdit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="provenance">Provenance ({item.provenanceEvents?.length || 0})</TabsTrigger>
              <TabsTrigger value="media">Media ({item.mediaAssets?.length || 0})</TabsTrigger>
              <TabsTrigger value="ai-auth">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Authentication
              </TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isEditing ? (
                    <>
                      {/* Read-only view */}
                      <div className="grid grid-cols-2 gap-4">
                        {item.brand && (
                          <div>
                            <Label className="text-gray-500">Brand</Label>
                            <div className="mt-1 font-medium">{item.brand}</div>
                          </div>
                        )}
                        {item.model && (
                          <div>
                            <Label className="text-gray-500">Model</Label>
                            <div className="mt-1 font-medium">{item.model}</div>
                          </div>
                        )}
                        {item.year && (
                          <div>
                            <Label className="text-gray-500">Year</Label>
                            <div className="mt-1 font-medium">{item.year}</div>
                          </div>
                        )}
                        {item.makeModel && (
                          <div className="col-span-2">
                            <Label className="text-gray-500">Full Make/Model</Label>
                            <div className="mt-1 font-medium">{item.makeModel}</div>
                          </div>
                        )}
                        {item.vin && (
                          <div className="col-span-2">
                            <Label className="text-gray-500">VIN</Label>
                            <div className="mt-1 font-mono text-sm">{item.vin}</div>
                          </div>
                        )}
                        {item.serialNumber && (
                          <div>
                            <Label className="text-gray-500">Serial Number</Label>
                            <div className="mt-1 font-mono text-sm">{item.serialNumber}</div>
                          </div>
                        )}
                        {item.referenceNumber && (
                          <div>
                            <Label className="text-gray-500">Reference Number</Label>
                            <div className="mt-1 font-mono text-sm">{item.referenceNumber}</div>
                          </div>
                        )}
                        <div className="col-span-2">
                          <Label className="text-gray-500">Status</Label>
                          <div className="mt-1">{getStatusBadge(item.status)}</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        {item.purchaseDate && (
                          <div>
                            <Label className="text-gray-500">Purchase Date</Label>
                            <div className="mt-1 font-medium">
                              {new Date(item.purchaseDate).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                        {item.purchasePrice && (
                          <div>
                            <Label className="text-gray-500">Purchase Price</Label>
                            <div className="mt-1 font-medium text-green-600">
                              ${parseFloat(item.purchasePrice.toString()).toLocaleString()}
                            </div>
                          </div>
                        )}
                        {item.estimatedValue && (
                          <div>
                            <Label className="text-gray-500">Current Est. Value</Label>
                            <div className="mt-1 font-semibold text-green-600 text-lg">
                              ${parseFloat(item.estimatedValue.toString()).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <>
                          <Separator />
                          <div>
                            <Label className="text-gray-500">Notes</Label>
                            <div className="mt-1 text-sm whitespace-pre-wrap">{item.notes}</div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Edit mode - Editable fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="brand">Brand</Label>
                          <Input
                            id="brand"
                            value={editForm.brand}
                            onChange={(e) => setEditForm(prev => ({ ...prev, brand: e.target.value }))}
                            placeholder="e.g., Ferrari"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="model">Model</Label>
                          <Input
                            id="model"
                            value={editForm.model}
                            onChange={(e) => setEditForm(prev => ({ ...prev, model: e.target.value }))}
                            placeholder="e.g., 458 Italia"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="year">Year</Label>
                          <Input
                            id="year"
                            type="number"
                            value={editForm.year}
                            onChange={(e) => setEditForm(prev => ({ ...prev, year: e.target.value }))}
                            placeholder="2014"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={editForm.status}
                            onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                          >
                            <SelectTrigger id="status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending Review</SelectItem>
                              <SelectItem value="verified">Verified</SelectItem>
                              <SelectItem value="flagged">Flagged</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="makeModel">Full Make/Model</Label>
                          <Input
                            id="makeModel"
                            value={editForm.makeModel}
                            onChange={(e) => setEditForm(prev => ({ ...prev, makeModel: e.target.value }))}
                            placeholder="e.g., 2014 Ferrari 458 Italia"
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="vin">VIN</Label>
                          <Input
                            id="vin"
                            value={editForm.vin}
                            onChange={(e) => setEditForm(prev => ({ ...prev, vin: e.target.value.toUpperCase() }))}
                            placeholder="17-character VIN"
                            className="font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="serialNumber">Serial Number</Label>
                          <Input
                            id="serialNumber"
                            value={editForm.serialNumber}
                            onChange={(e) => setEditForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                            placeholder="Serial number"
                            className="font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="referenceNumber">Reference Number</Label>
                          <Input
                            id="referenceNumber"
                            value={editForm.referenceNumber}
                            onChange={(e) => setEditForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                            placeholder="Reference number"
                            className="font-mono"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="purchaseDate">Purchase Date</Label>
                          <Input
                            id="purchaseDate"
                            type="date"
                            value={editForm.purchaseDate}
                            onChange={(e) => setEditForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                          <Input
                            id="purchasePrice"
                            type="number"
                            value={editForm.purchasePrice}
                            onChange={(e) => setEditForm(prev => ({ ...prev, purchasePrice: e.target.value }))}
                            placeholder="50000"
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="estimatedValue">Current Est. Value ($)</Label>
                          <Input
                            id="estimatedValue"
                            type="number"
                            value={editForm.estimatedValue}
                            onChange={(e) => setEditForm(prev => ({ ...prev, estimatedValue: e.target.value }))}
                            placeholder="75000"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={editForm.notes}
                          onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Any additional notes or details..."
                          rows={4}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="provenance" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Provenance Timeline</h3>
                <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Provenance Event</DialogTitle>
                      <DialogDescription>
                        Document important events in this asset's history
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Event Type</Label>
                        <Select
                          value={eventForm.eventType}
                          onValueChange={(value) => setEventForm(prev => ({ ...prev, eventType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="restoration_work">Restoration Work</SelectItem>
                            <SelectItem value="service_record">Service Record</SelectItem>
                            <SelectItem value="concours_event">Concours Event</SelectItem>
                            <SelectItem value="appraisal">Appraisal</SelectItem>
                            <SelectItem value="inspection">Inspection</SelectItem>
                            <SelectItem value="ownership_transfer">Ownership Transfer</SelectItem>
                            <SelectItem value="note_added">General Note</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          placeholder="e.g., Engine rebuilt at XYZ Motors"
                          value={eventForm.title}
                          onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Additional details about this event..."
                          rows={4}
                          value={eventForm.description}
                          onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={eventForm.occurredAt}
                          onChange={(e) => setEventForm(prev => ({ ...prev, occurredAt: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowAddEventDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleAddEvent}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            'Add Event'
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {item.provenanceEvents && item.provenanceEvents.length > 0 ? (
                  item.provenanceEvents.map((event, index) => (
                    <Card key={event.id}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              {getEventIcon(event.eventType)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <h4 className="font-semibold">{event.title}</h4>
                                <p className="text-sm text-gray-500">
                                  {formatEventType(event.eventType)}
                                  {event.user && ` • ${event.user.fullName}`}
                                </p>
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(event.occurredAt).toLocaleDateString()}
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Calendar className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 text-center">
                        No provenance events yet. Add events to track this asset's history.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Media Files</h3>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </span>
                  </Button>
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                  />
                </Label>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {item.mediaAssets && item.mediaAssets.length > 0 ? (
                  item.mediaAssets.map((media) => (
                    <Card key={media.id} className="overflow-hidden">
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        {media.type === 'photo' ? (
                          <FileImage className="h-12 w-12 text-gray-400" />
                        ) : (
                          <FileText className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium truncate">{media.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {(media.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full">
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileImage className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 text-center">
                          No media files yet. Upload photos or documents.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ai-auth">
              <AIAnalysisSection
                itemId={item.id}
                itemName={`${item.brand || ''} ${item.model || item.makeModel || ''}`.trim() || 'Item'}
                categorySlug={item.category.slug}
              />
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4">
              <CommentSection itemId={item.id} />
            </TabsContent>

            {/* Approvals Tab */}
            <TabsContent value="approvals" className="space-y-4">
              <ApprovalWorkflow itemId={item.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status</span>
                {getStatusBadge(item.status)}
              </div>
              {item.riskScore !== null && item.riskScore !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Risk Score</span>
                  <Badge variant="outline">{item.riskScore}/100</Badge>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Media Files</span>
                <span className="font-medium">{item.mediaAssets?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Events</span>
                <span className="font-medium">{item.provenanceEvents?.length || 0}</span>
              </div>
              <Separator />
              <div>
                <span className="text-gray-500 text-sm">Created By</span>
                <div className="mt-1">
                  <div className="font-medium">{item.createdBy.fullName}</div>
                  <div className="text-xs text-gray-500">{item.createdBy.email}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                <div>Created: {new Date(item.createdAt).toLocaleDateString()}</div>
                <div>Updated: {new Date(item.updatedAt).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this asset
              and remove all associated data including media files, provenance events, and certificates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Asset'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}