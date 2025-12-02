/**
 * Photo Guidance System
 * Provides real-time guidance overlays and tips for capturing asset photos
 */

export interface PhotoGuidance {
  documentType: string;
  title: string;
  instructions: string[];
  overlay?: {
    type: 'center-circle' | 'rectangle' | 'grid' | 'serial-focus';
    size?: 'small' | 'medium' | 'large';
    position?: 'center' | 'top' | 'bottom';
  };
  tips: string[];
  checkpoints: string[];
}

const PHOTO_GUIDANCE_MAP: Record<string, PhotoGuidance> = {
  // Watches
  watch_front: {
    documentType: 'watch_front',
    title: 'Watch Face (Front View)',
    instructions: [
      'Center the watch dial in the frame',
      'Ensure watch hands don\'t obscure the brand name',
      'Capture date windows and subdials clearly',
      'Avoid glare on the crystal',
    ],
    overlay: {
      type: 'center-circle',
      size: 'medium',
      position: 'center',
    },
    tips: [
      'Use natural lighting or diffused light',
      'Hold camera at 90° angle to dial',
      'Check for reflections before capturing',
    ],
    checkpoints: [
      'Brand name visible',
      'Dial features clear',
      'No glare on crystal',
    ],
  },

  watch_caseback: {
    documentType: 'watch_caseback',
    title: 'Case Back',
    instructions: [
      'Position case back centered in frame',
      'Focus on serial number area',
      'Capture all engravings clearly',
      'Clean case back before photographing',
    ],
    overlay: {
      type: 'serial-focus',
      size: 'medium',
      position: 'center',
    },
    tips: [
      'Use bright, even lighting',
      'Take multiple shots if serial is faint',
      'Zoom in on serial number if needed',
    ],
    checkpoints: [
      'Serial number readable',
      'All engravings visible',
      'Case back clean',
    ],
  },

  watch_clasp: {
    documentType: 'watch_clasp',
    title: 'Clasp/Bracelet',
    instructions: [
      'Open clasp to reveal inner markings',
      'Angle at 45° for best view',
      'Capture reference numbers inside',
      'Show bracelet end links',
    ],
    overlay: {
      type: 'rectangle',
      size: 'medium',
      position: 'center',
    },
    tips: [
      'Clean clasp interior',
      'Show clasp logo clearly',
      'Capture any micro-adjustments',
    ],
    checkpoints: [
      'Clasp logo visible',
      'Reference numbers clear',
      'Bracelet condition shown',
    ],
  },

  // Luxury Cars
  car_exterior_front: {
    documentType: 'car_exterior_front',
    title: 'Exterior - Front 3/4 View',
    instructions: [
      'Position car at 45° angle',
      'Ensure full vehicle is in frame',
      'Use natural daylight',
      'Keep wheels straight',
    ],
    overlay: {
      type: 'grid',
      size: 'large',
      position: 'center',
    },
    tips: [
      'Choose clean, uncluttered background',
      'Early morning or late afternoon light is best',
      'Show ground clearance',
    ],
    checkpoints: [
      'Full car visible',
      'Clean background',
      'Good lighting',
    ],
  },

  car_vin: {
    documentType: 'car_vin',
    title: 'VIN Plate',
    instructions: [
      'Locate VIN plate (dashboard or door jamb)',
      'Center VIN in frame',
      'Ensure all 17 characters visible',
      'Avoid glare on plate',
    ],
    overlay: {
      type: 'serial-focus',
      size: 'medium',
      position: 'center',
    },
    tips: [
      'Use overhead angle',
      'Turn off flash to avoid glare',
      'Clean plate if dirty',
    ],
    checkpoints: [
      'All 17 digits visible',
      'No glare on plate',
      'Clear and readable',
    ],
  },

  car_odometer: {
    documentType: 'car_odometer',
    title: 'Odometer Reading',
    instructions: [
      'Turn on ignition',
      'Center odometer in frame',
      'Ensure mileage is clearly readable',
      'Include dashboard warning lights',
    ],
    overlay: {
      type: 'rectangle',
      size: 'medium',
      position: 'center',
    },
    tips: [
      'Take photo from driver\'s perspective',
      'Ensure all digits are in focus',
      'Show service indicator if present',
    ],
    checkpoints: [
      'Mileage clearly visible',
      'All digits readable',
      'Dashboard lights shown',
    ],
  },

  // Handbags
  bag_exterior: {
    documentType: 'bag_exterior',
    title: 'Exterior - Full View',
    instructions: [
      'Place bag on neutral background',
      'Stuff bag to show proper shape',
      'Center bag in frame',
      'Use even, diffused lighting',
    ],
    overlay: {
      type: 'center-circle',
      size: 'large',
      position: 'center',
    },
    tips: [
      'White or light gray background works best',
      'Avoid harsh shadows',
      'Show all hardware clearly',
    ],
    checkpoints: [
      'Full bag visible',
      'Shape properly displayed',
      'Hardware visible',
    ],
  },

  bag_serial: {
    documentType: 'bag_serial',
    title: 'Serial Number / Date Code',
    instructions: [
      'Locate interior serial tag',
      'Use macro mode or zoom',
      'Ensure numbers are in focus',
      'Provide good lighting',
    ],
    overlay: {
      type: 'serial-focus',
      size: 'small',
      position: 'center',
    },
    tips: [
      'Hold camera steady',
      'May need to angle for best view',
      'Use flashlight for interior lighting',
    ],
    checkpoints: [
      'Serial tag visible',
      'Numbers/letters clear',
      'Date code readable',
    ],
  },

  // Jewelry
  jewelry_main: {
    documentType: 'jewelry_main',
    title: 'Main Photo',
    instructions: [
      'Place jewelry on white/black background',
      'Center piece in frame',
      'Use macro mode for detail',
      'Ensure even lighting',
    ],
    overlay: {
      type: 'center-circle',
      size: 'medium',
      position: 'center',
    },
    tips: [
      'Clean jewelry before photographing',
      'Avoid finger smudges',
      'Take multiple angles',
    ],
    checkpoints: [
      'Entire piece visible',
      'Clean background',
      'Details clear',
    ],
  },

  jewelry_hallmarks: {
    documentType: 'jewelry_hallmarks',
    title: 'Hallmarks & Stamps',
    instructions: [
      'Locate hallmark or stamp',
      'Use extreme close-up',
      'Provide bright, even lighting',
      'Hold camera steady',
    ],
    overlay: {
      type: 'serial-focus',
      size: 'small',
      position: 'center',
    },
    tips: [
      'May need magnification',
      'Try different angles',
      'Take multiple shots',
    ],
    checkpoints: [
      'Hallmark visible',
      'Metal stamp clear',
      'Maker\'s mark readable',
    ],
  },

  // Art
  art_front: {
    documentType: 'art_front',
    title: 'Front View',
    instructions: [
      'Position camera perpendicular to artwork',
      'Ensure entire artwork is in frame',
      'Use even, diffused lighting',
      'Avoid glare from glass/varnish',
    ],
    overlay: {
      type: 'grid',
      size: 'large',
      position: 'center',
    },
    tips: [
      'Use natural light when possible',
      'Keep camera parallel to artwork',
      'Check for reflections',
    ],
    checkpoints: [
      'Full artwork visible',
      'No glare',
      'Colors accurate',
    ],
  },

  art_signature: {
    documentType: 'art_signature',
    title: 'Artist Signature',
    instructions: [
      'Locate artist signature',
      'Use close-up mode',
      'Ensure signature is readable',
      'Capture date if present',
    ],
    overlay: {
      type: 'rectangle',
      size: 'small',
      position: 'center',
    },
    tips: [
      'Note signature location',
      'Capture edition number if present',
      'Multiple shots if signature is faint',
    ],
    checkpoints: [
      'Signature visible',
      'Date readable',
      'Location noted',
    ],
  },

  // Collectibles
  collectible_main: {
    documentType: 'collectible_main',
    title: 'Main Photo',
    instructions: [
      'Place collectible on neutral background',
      'Show complete item',
      'Use good focus',
      'Capture from multiple angles',
    ],
    overlay: {
      type: 'center-circle',
      size: 'medium',
      position: 'center',
    },
    tips: [
      'Show scale with ruler if small',
      'Neutral background preferred',
      'Good even lighting',
    ],
    checkpoints: [
      'Full item visible',
      'Scale shown if needed',
      'Details clear',
    ],
  },

  collectible_markings: {
    documentType: 'collectible_markings',
    title: 'Maker Marks / Serial Numbers',
    instructions: [
      'Locate identifying marks',
      'Use macro mode',
      'Provide bright lighting',
      'Take multiple shots if faint',
    ],
    overlay: {
      type: 'serial-focus',
      size: 'small',
      position: 'center',
    },
    tips: [
      'Clean area before photographing',
      'Try different angles',
      'Use magnification if available',
    ],
    checkpoints: [
      'Marks visible',
      'Serial number readable',
      'Stamps clear',
    ],
  },
};

/**
 * Get photo guidance for a specific document type
 */
export function getPhotoGuidance(documentType: string): PhotoGuidance | null {
  return PHOTO_GUIDANCE_MAP[documentType] || null;
}

/**
 * Get generic guidance if specific type not found
 */
export function getGenericGuidance(): PhotoGuidance {
  return {
    documentType: 'generic',
    title: 'Photo Capture',
    instructions: [
      'Ensure good lighting',
      'Keep camera steady',
      'Fill frame with subject',
      'Check focus before capturing',
    ],
    overlay: {
      type: 'center-circle',
      size: 'medium',
      position: 'center',
    },
    tips: [
      'Use natural lighting when possible',
      'Avoid harsh shadows',
      'Take multiple shots for best result',
    ],
    checkpoints: [
      'Well lit',
      'In focus',
      'Proper framing',
    ],
  };
}
