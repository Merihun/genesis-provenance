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
  const config: any = {
    region: process.env.AWS_REGION || 'us-west-2',
  };
  
  // Add explicit credentials if provided via environment variables
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }
  
  return new S3Client(config);
}
