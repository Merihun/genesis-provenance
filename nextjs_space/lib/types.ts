// Genesis Provenance - TypeScript Types

export type AssetCategory = {
  id: string
  name: string
  slug: string
}

export type AssetFormData = {
  categoryId: string
  brand?: string
  model?: string
  year?: number
  referenceNumber?: string
  serialNumber?: string
  vin?: string
  makeModel?: string
  matchingNumbers?: boolean
  purchaseDate?: string
  purchasePrice?: string
  estimatedValue?: string
  notes?: string
}

export type FileUploadData = {
  file: File
  type: 'photo' | 'document' | 'certificate'
}

export type ProvenanceEventFormData = {
  eventType: 'restoration_work' | 'service_record' | 'concours_event' | 'appraisal' | 'inspection' | 'note_added'
  title: string
  description?: string
  occurredAt?: string
  metadata?: Record<string, any>
}

export type VaultFilterOptions = {
  categoryId?: string
  status?: 'pending' | 'verified' | 'flagged' | 'rejected'
  searchQuery?: string
  sortBy?: 'date' | 'value' | 'brand'
  sortOrder?: 'asc' | 'desc'
}

export type AssetWithDetails = {
  id: string
  category: {
    name: string
    slug: string
  }
  brand?: string
  model?: string
  year?: number
  makeModel?: string
  vin?: string
  matchingNumbers?: boolean
  serialNumber?: string
  referenceNumber?: string
  purchaseDate?: Date
  purchasePrice?: number
  estimatedValue?: number
  status: string
  riskScore?: number
  notes?: string
  createdAt: Date
  updatedAt: Date
  mediaAssets?: Array<{
    id: string
    cloudStoragePath: string
    mediaType: string
    uploadedAt: Date
  }>
  _count?: {
    mediaAssets: number
    provenanceEvents: number
  }
}

export type DateRange = {
  from: Date | undefined
  to: Date | undefined
}