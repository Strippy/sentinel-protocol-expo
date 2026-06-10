'use strict';
require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const { logger }   = require('./logger');

const paymentRoutes    = require('./routes/payment');
const webhookRoutes    = require('./routes/webhook');
const invoiceRoutes    = require('./routes/invoice');
const subscribeRoutes  = require('./routes/subscribe');
const statsRoutes      = require('./routes/stats');
const ingestRoutes     = require('./routes/ingest');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max:      50,               // 50 requests per window per IP
    message:  { error: 'Too many requests — please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
// Raw body required for Stripe webhook signature verification
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health',     (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/b2b',       paymentRoutes);
app.use('/api/webhook',   webhookRoutes);
app.use('/api/invoice',   invoiceRoutes);
const adminRoutes = require('./routes/admin');
app.use('/api/admin',     adminRoutes);
app.use('/api/subscribe', subscribeRoutes);
app.use('/api/stats',     statsRoutes);
app.use('/api/ingest',   ingestRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
    res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
// Skip listen when required as a Vercel serverless module
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`Sentinel B2B server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
}

module.exports = app;  // for testing
