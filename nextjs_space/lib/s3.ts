import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();

/**
 * Upload a file to S3
 * @param buffer - File buffer to upload
 * @param key - S3 key (path) for the file
 * @param isPublic - Whether the file should be publicly accessible (default: false)
 * @param contentType - MIME type of the file
 * @returns The full S3 key (cloud_storage_path)
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  isPublic: boolean = false,
  contentType?: string
): Promise<string> {
  if (!bucketName) {
    throw new Error('AWS_BUCKET_NAME is not configured');
  }

  // Ensure the key includes the folder prefix
  const fullKey = folderPrefix ? `${folderPrefix}${key}` : key;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fullKey,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return fullKey;
}

/**
 * Generate a signed URL for downloading a file from S3
 * @param key - S3 key (cloud_storage_path) of the file
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Signed URL for downloading the file
 */
export async function downloadFile(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!bucketName) {
    throw new Error('AWS_BUCKET_NAME is not configured');
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  // Generate signed URL (valid for specified duration)
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
}

/**
 * Delete a file from S3
 * @param key - S3 key (cloud_storage_path) of the file to delete
 */
export async function deleteFile(key: string): Promise<void> {
  if (!bucketName) {
    throw new Error('AWS_BUCKET_NAME is not configured');
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Rename a file in S3 (copy to new key, then delete old key)
 * @param oldKey - Current S3 key (cloud_storage_path)
 * @param newKey - New S3 key
 * @returns The new S3 key (cloud_storage_path)
 */
export async function renameFile(oldKey: string, newKey: string): Promise<string> {
  if (!bucketName) {
    throw new Error('AWS_BUCKET_NAME is not configured');
  }

  // Ensure the new key includes the folder prefix
  const fullNewKey = folderPrefix ? `${folderPrefix}${newKey}` : newKey;

  // Copy to new location
  const copyCommand = new CopyObjectCommand({
    Bucket: bucketName,
    CopySource: `${bucketName}/${oldKey}`,
    Key: fullNewKey,
  });

  await s3Client.send(copyCommand);

  // Delete old file
  await deleteFile(oldKey);

  return fullNewKey;
}
