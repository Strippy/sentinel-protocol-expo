'use strict';

const express = require('express');
const AWS     = require('aws-sdk');
const { logger } = require('../logger');

const router = express.Router();
const s3     = new AWS.S3({ region: process.env.AWS_REGION });

/**
 * GET /api/invoice/:orderId/:filename
 *
 * Returns a 302 redirect to a fresh pre-signed S3 URL.
 * The original URL stored in Stripe metadata may have expired.
 */
router.get('/:orderId/:filename', async (req, res) => {
    const { orderId, filename } = req.params;
    const key = `invoices/${orderId}/${filename}`;

    try {
        // Verify the object exists
        await s3.headObject({ Bucket: process.env.S3_BUCKET_NAME, Key: key }).promise();

        const url = s3.getSignedUrl('getObject', {
            Bucket:  process.env.S3_BUCKET_NAME,
            Key:     key,
            Expires: 60 * 60,   // 1 hour
        });

        logger.info('Invoice download', { orderId, filename });
        return res.redirect(302, url);
    } catch (err) {
        if (err.code === 'NotFound') {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        logger.error('Invoice download error', { error: err.message });
        return res.status(500).json({ error: 'Could not retrieve invoice' });
    }
});

module.exports = router;
