import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { uploadFile } from '@/lib/s3'
import { getBucketConfig } from '@/lib/aws-config'

export const dynamic = 'force-dynamic'

// POST /api/items/[id]/media - Upload media file
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = session.user as any

    // Verify item ownership
    const item = await prisma.item.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as 'photo' | 'document' | 'certificate'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!type || !['photo', 'document', 'certificate'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    const { folderPrefix } = getBucketConfig()
    
    // Generate S3 key - private files for user uploads
    const timestamp = Date.now()
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const s3Key = `${folderPrefix}uploads/${params.id}/${timestamp}-${sanitizedFilename}`
    
    // Upload to S3 (private file)
    const cloudStoragePath = await uploadFile(buffer, s3Key, false)

    // Save to database
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        itemId: params.id,
        type,
        fileName: file.name,
        cloudStoragePath,
        fileSize: file.size,
        mimeType: file.type,
        isPublic: false,
      },
    })

    // Create provenance event
    await prisma.provenanceEvent.create({
      data: {
        itemId: params.id,
        userId: user.id,
        eventType: 'note_added',
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Uploaded`,
        description: `Uploaded ${file.name}`,
      },
    })

    return NextResponse.json({ mediaAsset }, { status: 201 })
  } catch (error) {
    console.error('Error uploading media:', error)
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}

// GET /api/items/[id]/media - Get all media for an item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = session.user as any

    // Verify item ownership
    const item = await prisma.item.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    const mediaAssets = await prisma.mediaAsset.findMany({
      where: { itemId: params.id },
      orderBy: { uploadedAt: 'desc' },
    })

    return NextResponse.json({ mediaAssets })
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}
