/**
 * Document Checklist Utility
 * Defines category-specific document requirements for luxury asset registration
 */

export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  examples: string[];
  captureGuide?: {
    angles: string[];
    tips: string[];
  };
}

export interface CategoryDocumentRequirements {
  categorySlug: string;
  categoryName: string;
  documents: DocumentRequirement[];
  totalRequired: number;
  recommendedOrder: string[];
}

// Document requirements by category
const DOCUMENT_REQUIREMENTS: Record<string, CategoryDocumentRequirements> = {
  watches: {
    categorySlug: 'watches',
    categoryName: 'Watches',
    documents: [
      {
        id: 'watch_front',
        name: 'Watch Face (Front View)',
        description: 'Clear photo of the watch dial showing brand, model, and complications',
        required: true,
        examples: ['Full dial visible', 'Centered frame', 'Good lighting'],
        captureGuide: {
          angles: ['Straight on', '90° angle to dial'],
          tips: [
            'Ensure watch hands don\'t obscure brand name',
            'Capture any date windows or subdials clearly',
            'Avoid glare on crystal',
          ],
        },
      },
      {
        id: 'watch_caseback',
        name: 'Case Back',
        description: 'Photo of the case back showing serial number and engravings',
        required: true,
        examples: ['Serial number visible', 'Movement visible (if exhibition back)', 'Engravings clear'],
        captureGuide: {
          angles: ['Direct overhead'],
          tips: [
            'Clean the case back before photographing',
            'Use good lighting to capture engravings',
            'Zoom in on serial number if needed',
          ],
        },
      },
      {
        id: 'watch_clasp',
        name: 'Clasp/Bracelet',
        description: 'Photo of the clasp showing brand markings and condition',
        required: false,
        examples: ['Clasp logo visible', 'Reference numbers', 'Bracelet condition'],
        captureGuide: {
          angles: ['Open clasp at 45°'],
          tips: ['Show any reference numbers inside clasp', 'Capture bracelet end links'],
        },
      },
      {
        id: 'watch_papers',
        name: 'Papers & Certificates',
        description: 'Warranty cards, certificates of authenticity, or service records',
        required: false,
        examples: ['Warranty card', 'Certificate of authenticity', 'Service papers'],
      },
      {
        id: 'watch_box',
        name: 'Original Box',
        description: 'Photos of the original box showing branding and condition',
        required: false,
        examples: ['Box exterior', 'Box interior with watch', 'Box certificate/booklet'],
      },
    ],
    totalRequired: 2,
    recommendedOrder: ['watch_front', 'watch_caseback', 'watch_clasp', 'watch_papers', 'watch_box'],
  },

  luxury_cars: {
    categorySlug: 'luxury_cars',
    categoryName: 'Luxury Cars',
    documents: [
      {
        id: 'car_exterior_front',
        name: 'Exterior - Front 3/4 View',
        description: 'Front three-quarter view showing full vehicle',
        required: true,
        examples: ['Full car visible', 'Clean background', 'Natural daylight'],
        captureGuide: {
          angles: ['45° from front corner'],
          tips: [
            'Photograph in natural daylight',
            'Choose clean, uncluttered background',
            'Ensure wheels are straight',
          ],
        },
      },
      {
        id: 'car_vin',
        name: 'VIN Plate',
        description: 'Clear photo of the VIN plate showing full 17-digit number',
        required: true,
        examples: ['VIN clearly readable', 'No glare', 'Entire plate in frame'],
        captureGuide: {
          angles: ['Direct overhead'],
          tips: [
            'VIN typically located on dashboard or door jamb',
            'Avoid flash to prevent glare',
            'Ensure all 17 characters are visible',
          ],
        },
      },
      {
        id: 'car_engine',
        name: 'Engine Bay',
        description: 'Photo of engine showing engine number and overall condition',
        required: false,
        examples: ['Engine number visible', 'Clean engine bay', 'Original components'],
        captureGuide: {
          angles: ['Overhead, centered'],
          tips: ['Open hood fully', 'Clean engine bay if possible', 'Show engine number plate'],
        },
      },
      {
        id: 'car_interior',
        name: 'Interior',
        description: 'Dashboard, seats, and overall interior condition',
        required: false,
        examples: ['Dashboard view', 'Front seats', 'Rear seats', 'Center console'],
      },
      {
        id: 'car_odometer',
        name: 'Odometer Reading',
        description: 'Clear photo of current mileage',
        required: true,
        examples: ['Mileage clearly readable', 'Warning lights visible'],
      },
      {
        id: 'car_documents',
        name: 'Title & Documents',
        description: 'Title, registration, service records, and maintenance history',
        required: false,
        examples: ['Clean title', 'Service records', 'Build sheet', 'Certificate of authenticity'],
      },
    ],
    totalRequired: 3,
    recommendedOrder: ['car_exterior_front', 'car_vin', 'car_odometer', 'car_interior', 'car_engine', 'car_documents'],
  },

  handbags: {
    categorySlug: 'handbags',
    categoryName: 'Handbags',
    documents: [
      {
        id: 'bag_exterior',
        name: 'Exterior - Full View',
        description: 'Complete exterior view of the handbag',
        required: true,
        examples: ['Full bag visible', 'Neutral background', 'Natural lighting'],
        captureGuide: {
          angles: ['Straight on', 'Slight 3/4 angle'],
          tips: [
            'Stuff bag to show shape',
            'Use white/neutral background',
            'Avoid harsh shadows',
          ],
        },
      },
      {
        id: 'bag_serial',
        name: 'Serial Number / Date Code',
        description: 'Interior tag showing serial number or date code',
        required: true,
        examples: ['Serial tag visible', 'Date code clear', 'Made in stamp'],
        captureGuide: {
          angles: ['Direct overhead of tag'],
          tips: [
            'Use macro mode or zoom',
            'Ensure numbers/letters are in focus',
            'Good lighting essential',
          ],
        },
      },
      {
        id: 'bag_hardware',
        name: 'Hardware Details',
        description: 'Close-ups of zippers, clasps, and metal hardware',
        required: false,
        examples: ['Zipper pull branding', 'Lock and keys', 'Metal plates/stamps'],
        captureGuide: {
          angles: ['Close-up, well-lit'],
          tips: ['Capture any brand engravings on hardware', 'Show lock and key sets'],
        },
      },
      {
        id: 'bag_interior',
        name: 'Interior',
        description: 'Interior lining, pockets, and condition',
        required: false,
        examples: ['Interior lining', 'Pocket details', 'Interior stamps'],
      },
      {
        id: 'bag_dustbag',
        name: 'Dust Bag & Packaging',
        description: 'Original dust bag, box, and authenticity cards',
        required: false,
        examples: ['Dust bag with logo', 'Original box', 'Authenticity card'],
      },
    ],
    totalRequired: 2,
    recommendedOrder: ['bag_exterior', 'bag_serial', 'bag_hardware', 'bag_interior', 'bag_dustbag'],
  },

  jewelry: {
    categorySlug: 'jewelry',
    categoryName: 'Jewelry',
    documents: [
      {
        id: 'jewelry_main',
        name: 'Main Photo',
        description: 'Clear photo of the jewelry piece showing overall design',
        required: true,
        examples: ['Entire piece visible', 'White background', 'Multiple angles'],
        captureGuide: {
          angles: ['Top view', 'Side view', '3/4 view'],
          tips: [
            'Use macro mode for detail',
            'White or black background works best',
            'Avoid finger smudges on piece',
          ],
        },
      },
      {
        id: 'jewelry_hallmarks',
        name: 'Hallmarks & Stamps',
        description: 'Close-up of maker\'s marks, metal stamps, and serial numbers',
        required: true,
        examples: ['Maker\'s mark visible', 'Metal purity stamp', 'Serial numbers'],
        captureGuide: {
          angles: ['Extreme close-up'],
          tips: [
            'Use magnification if available',
            'Bright, even lighting',
            'May need multiple attempts to capture clearly',
          ],
        },
      },
      {
        id: 'jewelry_gemstones',
        name: 'Gemstone Details',
        description: 'Close-up photos of gemstones showing clarity and cut',
        required: false,
        examples: ['Facets visible', 'Color accurate', 'Inclusions if any'],
      },
      {
        id: 'jewelry_certificate',
        name: 'Certification',
        description: 'GIA, AGS, or other gemological certificates',
        required: false,
        examples: ['Full certificate', 'Certificate number', 'Grading details'],
      },
      {
        id: 'jewelry_packaging',
        name: 'Original Packaging',
        description: 'Original box, papers, and purchase receipts',
        required: false,
        examples: ['Branded box', 'Authenticity papers', 'Appraisal documents'],
      },
    ],
    totalRequired: 2,
    recommendedOrder: ['jewelry_main', 'jewelry_hallmarks', 'jewelry_gemstones', 'jewelry_certificate', 'jewelry_packaging'],
  },

  art: {
    categorySlug: 'art',
    categoryName: 'Art',
    documents: [
      {
        id: 'art_front',
        name: 'Front View',
        description: 'Full frontal view of the artwork',
        required: true,
        examples: ['Entire artwork visible', 'Straight-on angle', 'Even lighting'],
        captureGuide: {
          angles: ['Directly perpendicular to artwork'],
          tips: [
            'Avoid glare from glass/varnish',
            'Use diffused natural light',
            'Keep camera parallel to artwork',
          ],
        },
      },
      {
        id: 'art_signature',
        name: 'Artist Signature',
        description: 'Close-up of artist signature and date',
        required: true,
        examples: ['Signature clearly visible', 'Date if present', 'Edition number'],
        captureGuide: {
          angles: ['Close-up, well-lit'],
          tips: ['Capture any edition numbers', 'Note signature location'],
        },
      },
      {
        id: 'art_back',
        name: 'Verso (Back)',
        description: 'Back of artwork showing labels, stamps, and inscriptions',
        required: false,
        examples: ['Gallery labels', 'Previous auction stamps', 'Artist inscriptions'],
      },
      {
        id: 'art_detail',
        name: 'Detail Shots',
        description: 'Close-ups showing technique, condition, and materials',
        required: false,
        examples: ['Brushwork detail', 'Texture', 'Any damage/restoration'],
      },
      {
        id: 'art_provenance',
        name: 'Provenance Documents',
        description: 'Certificates of authenticity, bills of sale, exhibition history',
        required: false,
        examples: ['Certificate of authenticity', 'Gallery receipts', 'Exhibition catalogs'],
      },
    ],
    totalRequired: 2,
    recommendedOrder: ['art_front', 'art_signature', 'art_back', 'art_detail', 'art_provenance'],
  },

  collectibles: {
    categorySlug: 'collectibles',
    categoryName: 'Collectibles',
    documents: [
      {
        id: 'collectible_main',
        name: 'Main Photo',
        description: 'Clear photo showing the complete collectible',
        required: true,
        examples: ['Full item visible', 'All angles', 'Good lighting'],
        captureGuide: {
          angles: ['Multiple angles recommended'],
          tips: ['Show scale with ruler/coin if small', 'Neutral background', 'Good focus'],
        },
      },
      {
        id: 'collectible_markings',
        name: 'Maker Marks / Serial Numbers',
        description: 'Any identifying marks, signatures, or serial numbers',
        required: true,
        examples: ['Manufacturer marks', 'Serial numbers', 'Stamps/hallmarks'],
        captureGuide: {
          angles: ['Close-up'],
          tips: ['Use macro mode', 'Bright lighting', 'Multiple shots if marks are faint'],
        },
      },
      {
        id: 'collectible_condition',
        name: 'Condition Details',
        description: 'Photos highlighting condition and any flaws',
        required: false,
        examples: ['Close-ups of wear', 'Any damage', 'Restoration work'],
      },
      {
        id: 'collectible_packaging',
        name: 'Original Packaging',
        description: 'Original box, packaging, and documentation',
        required: false,
        examples: ['Original box', 'Certificates', 'Instruction manuals'],
      },
      {
        id: 'collectible_certificate',
        name: 'Authentication',
        description: 'Certificates of authenticity or grading reports',
        required: false,
        examples: ['COA', 'Grading certificates', 'Expert opinions'],
      },
    ],
    totalRequired: 2,
    recommendedOrder: ['collectible_main', 'collectible_markings', 'collectible_condition', 'collectible_packaging', 'collectible_certificate'],
  },
};

/**
 * Get document requirements for a specific category
 */
export function getDocumentRequirements(categorySlug: string): CategoryDocumentRequirements | null {
  return DOCUMENT_REQUIREMENTS[categorySlug] || null;
}

/**
 * Get all available categories with document requirements
 */
export function getAllCategoryRequirements(): CategoryDocumentRequirements[] {
  return Object.values(DOCUMENT_REQUIREMENTS);
}

/**
 * Calculate upload progress for a category
 */
export function calculateProgress(
  categorySlug: string,
  uploadedDocumentIds: string[]
): {
  uploaded: number;
  total: number;
  required: number;
  requiredUploaded: number;
  percentage: number;
  isComplete: boolean;
} {
  const requirements = getDocumentRequirements(categorySlug);
  
  if (!requirements) {
    return {
      uploaded: 0,
      total: 0,
      required: 0,
      requiredUploaded: 0,
      percentage: 0,
      isComplete: false,
    };
  }

  const totalDocuments = requirements.documents.length;
  const requiredDocuments = requirements.documents.filter(d => d.required);
  const uploadedCount = uploadedDocumentIds.length;
  const requiredUploadedCount = uploadedDocumentIds.filter(id => 
    requiredDocuments.some(d => d.id === id)
  ).length;

  const percentage = Math.round((uploadedCount / totalDocuments) * 100);
  const isComplete = requiredUploadedCount >= requirements.totalRequired;

  return {
    uploaded: uploadedCount,
    total: totalDocuments,
    required: requirements.totalRequired,
    requiredUploaded: requiredUploadedCount,
    percentage,
    isComplete,
  };
}

/**
 * Get next recommended document to upload
 */
export function getNextRecommendedDocument(
  categorySlug: string,
  uploadedDocumentIds: string[]
): DocumentRequirement | null {
  const requirements = getDocumentRequirements(categorySlug);
  
  if (!requirements) return null;

  // Follow recommended order
  for (const docId of requirements.recommendedOrder) {
    if (!uploadedDocumentIds.includes(docId)) {
      const doc = requirements.documents.find(d => d.id === docId);
      if (doc) return doc;
    }
  }

  return null;
}
