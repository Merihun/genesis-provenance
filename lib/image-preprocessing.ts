/**
 * Image Preprocessing Utilities for AI Analysis
 * Optimizes images before sending to Computer Vision APIs
 */

import sharp from 'sharp';

export interface PreprocessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  enhanceContrast?: boolean;
  sharpen?: boolean;
}

export interface PreprocessedImage {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Default preprocessing options optimized for CV APIs
 */
const DEFAULT_OPTIONS: PreprocessingOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 90,
  format: 'jpeg',
  enhanceContrast: true,
  sharpen: true,
};

/**
 * Preprocess an image for optimal AI analysis
 * - Resize to optimal dimensions
 * - Enhance contrast and sharpness
 * - Convert to optimal format
 * - Reduce file size while maintaining quality
 */
export async function preprocessImage(
  imageBuffer: Buffer,
  options: PreprocessingOptions = {}
): Promise<PreprocessedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    let pipeline = sharp(imageBuffer);

    // Get original metadata
    const metadata = await pipeline.metadata();
    console.log(`[Preprocessing] Original image: ${metadata.width}x${metadata.height}, format: ${metadata.format}, size: ${imageBuffer.length} bytes`);

    // Resize if needed (maintaining aspect ratio)
    if (
      (metadata.width && metadata.width > opts.maxWidth!) ||
      (metadata.height && metadata.height > opts.maxHeight!)
    ) {
      pipeline = pipeline.resize(opts.maxWidth, opts.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
      console.log(`[Preprocessing] Resizing to max ${opts.maxWidth}x${opts.maxHeight}`);
    }

    // Enhance contrast if enabled
    if (opts.enhanceContrast) {
      pipeline = pipeline.normalize();
      console.log(`[Preprocessing] Enhancing contrast`);
    }

    // Sharpen if enabled (helps with text detection)
    if (opts.sharpen) {
      pipeline = pipeline.sharpen();
      console.log(`[Preprocessing] Applying sharpening`);
    }

    // Convert to optimal format with quality settings
    switch (opts.format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: opts.quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality: opts.quality, compressionLevel: 9 });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality: opts.quality });
        break;
    }

    // Process the image
    const processedBuffer = await pipeline.toBuffer();
    const processedMetadata = await sharp(processedBuffer).metadata();

    console.log(
      `[Preprocessing] Processed image: ${processedMetadata.width}x${processedMetadata.height}, ` +
      `format: ${processedMetadata.format}, size: ${processedBuffer.length} bytes ` +
      `(${Math.round((processedBuffer.length / imageBuffer.length) * 100)}% of original)`
    );

    return {
      buffer: processedBuffer,
      format: processedMetadata.format || opts.format!,
      width: processedMetadata.width || 0,
      height: processedMetadata.height || 0,
      size: processedBuffer.length,
    };
  } catch (error) {
    console.error('[Preprocessing] Error:', error);
    // Return original buffer if preprocessing fails
    const metadata = await sharp(imageBuffer).metadata();
    return {
      buffer: imageBuffer,
      format: metadata.format || 'jpeg',
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: imageBuffer.length,
    };
  }
}

/**
 * Batch preprocess multiple images
 */
export async function preprocessImages(
  imageBuffers: Buffer[],
  options: PreprocessingOptions = {}
): Promise<PreprocessedImage[]> {
  console.log(`[Preprocessing] Batch processing ${imageBuffers.length} images`);
  const startTime = Date.now();

  const results = await Promise.all(
    imageBuffers.map((buffer) => preprocessImage(buffer, options))
  );

  const processingTime = Date.now() - startTime;
  console.log(`[Preprocessing] Batch complete in ${processingTime}ms`);

  return results;
}

/**
 * Fetch image from URL and preprocess
 */
export async function fetchAndPreprocessImage(
  imageUrl: string,
  options: PreprocessingOptions = {}
): Promise<PreprocessedImage> {
  try {
    console.log(`[Preprocessing] Fetching image from: ${imageUrl}`);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return await preprocessImage(buffer, options);
  } catch (error) {
    console.error('[Preprocessing] Fetch error:', error);
    throw error;
  }
}

/**
 * Get optimal preprocessing options for a specific CV provider
 */
export function getProviderOptimalOptions(provider: 'google-vision' | 'aws-rekognition'): PreprocessingOptions {
  switch (provider) {
    case 'google-vision':
      // Google Vision AI optimal settings
      return {
        maxWidth: 4096,
        maxHeight: 4096,
        quality: 90,
        format: 'jpeg',
        enhanceContrast: true,
        sharpen: true,
      };
    case 'aws-rekognition':
      // AWS Rekognition optimal settings
      return {
        maxWidth: 4096,
        maxHeight: 4096,
        quality: 95,
        format: 'jpeg',
        enhanceContrast: false, // Rekognition handles this internally
        sharpen: true,
      };
    default:
      return DEFAULT_OPTIONS;
  }
}
