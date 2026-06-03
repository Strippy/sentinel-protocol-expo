'use strict';

const AWS    = require('aws-sdk');
const { logger } = require('../logger');

const s3 = new AWS.S3({ region: process.env.AWS_REGION });

/**
 * Uploads a Buffer to S3 with:
 *   - Server-side KMS encryption
 *   - Private ACL (no public access)
 *   - Content-Disposition set for PDF download
 *
 * Returns the S3 object URL (pre-signed, 7-day expiry).
 */
async function uploadToS3(buffer, key) {
    const params = {
        Bucket:               process.env.S3_BUCKET_NAME,
        Key:                  key,
        Body:                 buffer,
        ContentType:          'application/pdf',
        ContentDisposition:   `attachment; filename="${key.split('/').pop()}"`,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId:          process.env.KMS_KEY_ARN,
    };

    await s3.putObject(params).promise();
    logger.info('Uploaded to S3', { key, bucket: params.Bucket });

    // Generate a 7-day pre-signed URL for secure download
    const signedUrl = s3.getSignedUrl('getObject', {
        Bucket:  params.Bucket,
        Key:     key,
        Expires: 7 * 24 * 60 * 60,  // 7 days
    });

    return signedUrl;
}

module.exports = { uploadToS3 };
