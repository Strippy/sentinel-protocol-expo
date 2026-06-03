'use strict';

/**
 * Shared-secret API key middleware.
 * Android app sends X-Sentinel-API-Key header; value must match API_KEY env var.
 * This prevents unauthenticated actors from creating PaymentIntents on your Stripe account.
 */
function requireApiKey(req, res, next) {
    const key = req.headers['x-sentinel-api-key'];
    if (!key || key !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

module.exports = { requireApiKey };
