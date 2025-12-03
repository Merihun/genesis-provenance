/**
 * Test script to verify AWS S3 connection and credentials
 * Run with: yarn tsx --require dotenv/config scripts/test-s3-connection.ts
 */

import { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createS3Client, getBucketConfig } from '../lib/aws-config';

async function testS3Connection() {
  console.log('\n🔧 Testing AWS S3 Connection...\n');

  try {
    // Check environment variables
    console.log('1️⃣ Checking environment variables...');
    const requiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_BUCKET_NAME', 'AWS_REGION'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
      console.log('\nPlease add these to your .env file:\n');
      missing.forEach(varName => {
        console.log(`${varName}=your_value_here`);
      });
      process.exit(1);
    }
    
    console.log('✅ All required environment variables found');
    console.log(`   - AWS_REGION: ${process.env.AWS_REGION}`);
    console.log(`   - AWS_BUCKET_NAME: ${process.env.AWS_BUCKET_NAME}`);
    console.log(`   - AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 8)}...`);

    // Initialize S3 client
    console.log('\n2️⃣ Initializing S3 client...');
    const s3Client = createS3Client();
    const bucketConfig = getBucketConfig();
    console.log('✅ S3 client initialized');
    console.log(`   - Bucket: ${bucketConfig.bucketName}`);
    console.log(`   - Folder prefix: ${bucketConfig.folderPrefix || '(none)'}`);

    // Test: List buckets (verify credentials)
    console.log('\n3️⃣ Testing credentials (listing buckets)...');
    const listBucketsCommand = new ListBucketsCommand({});
    const bucketsList = await s3Client.send(listBucketsCommand);
    console.log(`✅ Credentials valid! Found ${bucketsList.Buckets?.length || 0} bucket(s)`);

    // Test: Upload a test file
    console.log('\n4️⃣ Testing file upload...');
    const testKey = `${bucketConfig.folderPrefix}test/test-${Date.now()}.txt`;
    const testContent = 'Hello from Genesis Provenance! This is a test file.';
    
    const putCommand = new PutObjectCommand({
      Bucket: bucketConfig.bucketName,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
    });
    
    await s3Client.send(putCommand);
    console.log('✅ File uploaded successfully');
    console.log(`   - Key: ${testKey}`);

    // Test: Download the file
    console.log('\n5️⃣ Testing file download...');
    const getCommand = new GetObjectCommand({
      Bucket: bucketConfig.bucketName,
      Key: testKey,
    });
    
    const getResponse = await s3Client.send(getCommand);
    const downloadedContent = await getResponse.Body?.transformToString();
    
    if (downloadedContent === testContent) {
      console.log('✅ File downloaded successfully and content matches');
    } else {
      console.error('❌ Downloaded content does not match uploaded content');
    }

    // Test: Delete the test file
    console.log('\n6️⃣ Testing file deletion...');
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketConfig.bucketName,
      Key: testKey,
    });
    
    await s3Client.send(deleteCommand);
    console.log('✅ File deleted successfully');

    // Success
    console.log('\n🎉 All tests passed! Your AWS S3 setup is working correctly.\n');
    console.log('Next steps:');
    console.log('1. Add these same credentials to Vercel environment variables');
    console.log('2. Test file uploads in your application');
    console.log('3. Monitor S3 usage in AWS Console\n');

  } catch (error: any) {
    console.error('\n❌ Test failed with error:\n');
    console.error(error.message || error);
    
    if (error.Code === 'InvalidAccessKeyId') {
      console.log('\n💡 Troubleshooting: Invalid AWS_ACCESS_KEY_ID');
      console.log('   - Check that AWS_ACCESS_KEY_ID is correct');
      console.log('   - Verify you copied the full key without extra spaces');
    } else if (error.Code === 'SignatureDoesNotMatch') {
      console.log('\n💡 Troubleshooting: Invalid AWS_SECRET_ACCESS_KEY');
      console.log('   - Check that AWS_SECRET_ACCESS_KEY is correct');
      console.log('   - Verify you copied the full secret without extra spaces');
    } else if (error.Code === 'NoSuchBucket') {
      console.log('\n💡 Troubleshooting: Bucket not found');
      console.log('   - Verify AWS_BUCKET_NAME matches your bucket exactly');
      console.log('   - Check that AWS_REGION matches where you created the bucket');
    } else if (error.Code === 'AccessDenied') {
      console.log('\n💡 Troubleshooting: Access denied');
      console.log('   - Verify IAM user has proper S3 permissions');
      console.log('   - Check that the bucket policy allows your IAM user');
    }
    
    console.log('\n');
    process.exit(1);
  }
}

// Run the test
testS3Connection();
