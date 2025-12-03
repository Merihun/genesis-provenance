/**
 * VIN Lookup Utility
 * 
 * Integrates with NHTSA vPIC API for vehicle identification number decoding.
 * Provides free, government-backed vehicle specifications for luxury cars.
 * 
 * Primary API: NHTSA Vehicle Product Information Catalog (vPIC)
 * - Free, no authentication required
 * - Supports vehicles from 1981+
 * - Returns: make, model, year, trim, engine, body type, etc.
 * 
 * Future enhancements can add premium providers (DataOne, Vincario, Carfax)
 */

export interface VINDecodeResult {
  success: boolean;
  vin: string;
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  bodyClass?: string;
  engineCylinders?: string;
  engineDisplacement?: string;
  engineModel?: string;
  fuelType?: string;
  transmission?: string;
  driveType?: string;
  vehicleType?: string;
  manufacturer?: string;
  plantCountry?: string;
  plantCity?: string;
  plantState?: string;
  doors?: string;
  series?: string;
  errorMessage?: string;
  rawData?: any; // Full NHTSA response for debugging
}

export interface VINValidationResult {
  isValid: boolean;
  errorMessage?: string;
  format?: 'valid' | 'too_short' | 'too_long' | 'invalid_characters';
}

/**
 * Validates VIN format (basic check)
 * A valid VIN is 17 characters, excluding I, O, and Q
 */
export function validateVIN(vin: string): VINValidationResult {
  if (!vin || typeof vin !== 'string') {
    return {
      isValid: false,
      errorMessage: 'VIN is required',
    };
  }

  const cleanVIN = vin.trim().toUpperCase();

  // Check length
  if (cleanVIN.length < 17) {
    return {
      isValid: false,
      errorMessage: `VIN is too short (${cleanVIN.length} characters). Must be exactly 17 characters.`,
      format: 'too_short',
    };
  }

  if (cleanVIN.length > 17) {
    return {
      isValid: false,
      errorMessage: `VIN is too long (${cleanVIN.length} characters). Must be exactly 17 characters.`,
      format: 'too_long',
    };
  }

  // Check for invalid characters (I, O, Q are not allowed in VINs)
  const invalidChars = /[IOQ]/;
  if (invalidChars.test(cleanVIN)) {
    return {
      isValid: false,
      errorMessage: 'VIN contains invalid characters (I, O, or Q are not allowed)',
      format: 'invalid_characters',
    };
  }

  // Check for alphanumeric only
  const validChars = /^[A-HJ-NPR-Z0-9]{17}$/;
  if (!validChars.test(cleanVIN)) {
    return {
      isValid: false,
      errorMessage: 'VIN must contain only letters and numbers (excluding I, O, Q)',
      format: 'invalid_characters',
    };
  }

  return {
    isValid: true,
    format: 'valid',
  };
}

/**
 * Decodes VIN using NHTSA vPIC API
 * 
 * @param vin - Vehicle Identification Number (17 characters)
 * @param modelYear - Optional model year for more accurate decoding
 * @returns Decoded vehicle information
 */
export async function decodeVIN(
  vin: string,
  modelYear?: string | number
): Promise<VINDecodeResult> {
  try {
    // Validate VIN format first
    const validation = validateVIN(vin);
    if (!validation.isValid) {
      return {
        success: false,
        vin,
        errorMessage: validation.errorMessage,
      };
    }

    const cleanVIN = vin.trim().toUpperCase();

    // Construct NHTSA API URL
    // Using DecodeVinValues for flat file format (easier parsing)
    let apiUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${cleanVIN}`;
    
    // Add model year if provided for more accurate results
    if (modelYear) {
      apiUrl += `?modelyear=${modelYear}`;
    }
    
    apiUrl += `${modelYear ? '&' : '?'}format=json`;

    // Call NHTSA API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // NHTSA returns array with single result
    if (!data.Results || data.Results.length === 0) {
      return {
        success: false,
        vin: cleanVIN,
        errorMessage: 'No data found for this VIN',
      };
    }

    const result = data.Results[0];

    // Check if VIN was successfully decoded
    // NHTSA returns ErrorCode field: "0" means success
    if (result.ErrorCode !== '0' && result.ErrorCode !== 0) {
      return {
        success: false,
        vin: cleanVIN,
        errorMessage: result.ErrorText || 'Unable to decode VIN',
        rawData: result,
      };
    }

    // Extract relevant fields
    const decodedData: VINDecodeResult = {
      success: true,
      vin: cleanVIN,
      year: result.ModelYear || undefined,
      make: result.Make || undefined,
      model: result.Model || undefined,
      trim: result.Trim || undefined,
      bodyClass: result.BodyClass || undefined,
      engineCylinders: result.EngineCylinders || undefined,
      engineDisplacement: result.DisplacementL || undefined,
      engineModel: result.EngineModel || undefined,
      fuelType: result.FuelTypePrimary || undefined,
      transmission: result.TransmissionStyle || undefined,
      driveType: result.DriveType || undefined,
      vehicleType: result.VehicleType || undefined,
      manufacturer: result.Manufacturer || result.ManufacturerName || undefined,
      plantCountry: result.PlantCountry || undefined,
      plantCity: result.PlantCity || undefined,
      plantState: result.PlantState || undefined,
      doors: result.Doors || undefined,
      series: result.Series || undefined,
      rawData: result, // Include full response for debugging
    };

    // Filter out undefined values and empty strings
    Object.keys(decodedData).forEach((key) => {
      const value = (decodedData as any)[key];
      if (value === '' || value === 'Not Applicable' || value === 'N/A') {
        delete (decodedData as any)[key];
      }
    });

    return decodedData;
  } catch (error) {
    console.error('VIN decode error:', error);
    return {
      success: false,
      vin,
      errorMessage: error instanceof Error ? error.message : 'Failed to decode VIN',
    };
  }
}

/**
 * Format VIN decode result for display
 */
export function formatVINInfo(result: VINDecodeResult): string {
  if (!result.success) {
    return `Error: ${result.errorMessage || 'Unknown error'}`;
  }

  const parts: string[] = [];

  if (result.year) parts.push(result.year);
  if (result.make) parts.push(result.make);
  if (result.model) parts.push(result.model);
  if (result.trim) parts.push(result.trim);

  return parts.length > 0 ? parts.join(' ') : 'Vehicle information decoded';
}

/**
 * Get suggested Make & Model from VIN decode result
 * Formats as "YYYY Make Model Trim" for the makeModel field
 */
export function getSuggestedMakeModel(result: VINDecodeResult): string {
  if (!result.success) return '';

  const parts: string[] = [];

  if (result.year) parts.push(result.year);
  if (result.make) parts.push(result.make);
  if (result.model) parts.push(result.model);
  if (result.trim && result.trim !== result.model) parts.push(result.trim);

  return parts.join(' ');
}

/**
 * Extract year from VIN decode result
 */
export function getVehicleYear(result: VINDecodeResult): number | undefined {
  if (!result.success || !result.year) return undefined;
  
  const yearNum = parseInt(result.year, 10);
  return isNaN(yearNum) ? undefined : yearNum;
}

/**
 * Check if decoded vehicle is a luxury brand
 */
export function isLuxuryBrand(make?: string): boolean {
  if (!make) return false;

  const luxuryBrands = [
    'MERCEDES-BENZ', 'MERCEDES', 'BMW', 'AUDI', 'PORSCHE', 'JAGUAR', 'LAND ROVER',
    'RANGE ROVER', 'BENTLEY', 'ROLLS-ROYCE', 'MASERATI', 'FERRARI', 'LAMBORGHINI',
    'ASTON MARTIN', 'MCLAREN', 'BUGATTI', 'LEXUS', 'CADILLAC', 'LINCOLN', 'ACURA',
    'INFINITI', 'GENESIS', 'TESLA', 'LUCID', 'RIVIAN'
  ];

  const makeUpper = make.toUpperCase();
  return luxuryBrands.some(brand => makeUpper.includes(brand));
}
