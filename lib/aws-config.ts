import { S3Client } from '@aws-sdk/client-s3';

/**
 * Get S3 bucket configuration from environment variables
 */
export function getBucketConfig() {
  return {
    bucketName: process.env.AWS_BUCKET_NAME,
    folderPrefix: process.env.AWS_FOLDER_PREFIX || '',
  };
}

/**
 * Create and configure S3 client
 * Uses default credential chain (environment variables, IAM roles, etc.)
 */
export function createS3Client(): S3Client {
  return new S3Client({});
}
