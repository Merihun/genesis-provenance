import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['collector', 'reseller', 'partner', 'admin']),
  organizationName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User with this email already exists',
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // IMPORTANT: Create organization for ALL users (required for the app to function)
    // Determine organization type based on role
    const orgType =
      validatedData.role === 'reseller'
        ? 'reseller'
        : validatedData.role === 'partner'
        ? 'partner'
        : 'individual'; // Default for collectors and admins

    // Create organization with appropriate name
    const organization = await prisma.organization.create({
      data: {
        name: validatedData.organizationName || `${validatedData.fullName}'s Organization`,
        type: orgType,
      },
    });

    // Create user with organization
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        fullName: validatedData.fullName,
        role: validatedData.role,
        organizationId: organization.id,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create user',
      },
      { status: 500 }
    );
  }
}
