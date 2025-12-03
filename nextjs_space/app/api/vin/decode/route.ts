import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { decodeVIN, validateVIN, getSuggestedMakeModel, getVehicleYear, isLuxuryBrand } from '@/lib/vin-lookup';

export const dynamic = 'force-dynamic';

/**
 * POST /api/vin/decode
 * 
 * Decodes a Vehicle Identification Number (VIN) using the NHTSA vPIC API
 * 
 * Request body:
 * - vin: string (required) - 17-character VIN
 * - modelYear: string | number (optional) - Vehicle model year for more accurate decoding
 * 
 * Returns:
 * - Decoded vehicle information including make, model, year, trim, engine specs, etc.
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { vin, modelYear } = body;

    // Validate input
    if (!vin) {
      return NextResponse.json(
        { error: 'VIN is required' },
        { status: 400 }
      );
    }

    // Basic VIN validation first
    const validation = validateVIN(vin);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.errorMessage,
          validation,
        },
        { status: 400 }
      );
    }

    // Decode VIN using NHTSA API
    console.log('Decoding VIN:', vin, 'with model year:', modelYear);
    const result = await decodeVIN(vin, modelYear);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.errorMessage || 'Failed to decode VIN',
          result,
        },
        { status: 400 }
      );
    }

    // Prepare response with additional helpful fields
    const response = {
      success: true,
      vin: result.vin,
      vehicleInfo: {
        year: result.year,
        make: result.make,
        model: result.model,
        trim: result.trim,
        bodyClass: result.bodyClass,
        engineCylinders: result.engineCylinders,
        engineDisplacement: result.engineDisplacement,
        engineModel: result.engineModel,
        fuelType: result.fuelType,
        transmission: result.transmission,
        driveType: result.driveType,
        vehicleType: result.vehicleType,
        manufacturer: result.manufacturer,
        plantCountry: result.plantCountry,
        plantCity: result.plantCity,
        plantState: result.plantState,
        doors: result.doors,
        series: result.series,
      },
      // Suggested values for auto-populating form fields
      suggestions: {
        makeModel: getSuggestedMakeModel(result),
        year: getVehicleYear(result),
        isLuxuryBrand: isLuxuryBrand(result.make),
      },
      // Full raw data for debugging (can be removed in production)
      rawData: result.rawData,
    };

    console.log('VIN decoded successfully:', response.suggestions.makeModel);

    return NextResponse.json(response);
  } catch (error) {
    console.error('VIN decode API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vin/decode?vin=XXXXX&modelYear=2020
 * 
 * Alternative GET endpoint for VIN decoding (for browser testing)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const vin = searchParams.get('vin');
    const modelYear = searchParams.get('modelYear');

    // Validate input
    if (!vin) {
      return NextResponse.json(
        { error: 'VIN query parameter is required' },
        { status: 400 }
      );
    }

    // Basic VIN validation
    const validation = validateVIN(vin);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.errorMessage,
          validation,
        },
        { status: 400 }
      );
    }

    // Decode VIN
    const result = await decodeVIN(vin, modelYear || undefined);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.errorMessage || 'Failed to decode VIN',
          result,
        },
        { status: 400 }
      );
    }

    // Prepare response
    const response = {
      success: true,
      vin: result.vin,
      vehicleInfo: {
        year: result.year,
        make: result.make,
        model: result.model,
        trim: result.trim,
        bodyClass: result.bodyClass,
        engineCylinders: result.engineCylinders,
        engineDisplacement: result.engineDisplacement,
        engineModel: result.engineModel,
        fuelType: result.fuelType,
        transmission: result.transmission,
        driveType: result.driveType,
        vehicleType: result.vehicleType,
        manufacturer: result.manufacturer,
        plantCountry: result.plantCountry,
        plantCity: result.plantCity,
        plantState: result.plantState,
        doors: result.doors,
        series: result.series,
      },
      suggestions: {
        makeModel: getSuggestedMakeModel(result),
        year: getVehicleYear(result),
        isLuxuryBrand: isLuxuryBrand(result.make),
      },
      rawData: result.rawData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('VIN decode API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
