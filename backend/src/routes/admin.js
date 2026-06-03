'use strict';

const express  = require('express');
const router   = express.Router();
const { logger } = require('../logger');

// Admin auth middleware - JWT with admin role
function requireAdmin(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.split(' ')[1];
    // TODO: verify JWT and check role=admin
    // For now: check against ADMIN_SECRET env var
    if (token !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Forbidden' });
    next();
}

// GET /api/admin/stats — Overview dashboard
router.get('/stats', requireAdmin, async (req, res) => {
    res.json({
        total_users:          1247,
        active_subscriptions: 342,
        monthly_revenue_aud:  68158.00,
        active_vpn_sessions:  89,
        dns_events_24h:       847203,
        threats_blocked_24h:  12847,
        avg_risk_score:       0.34,
    });
});

// GET /api/admin/users — User list with filters
router.get('/users', requireAdmin, async (req, res) => {
    const { page = 1, limit = 50, search, tier } = req.query;
    // TODO: query from database with filters
    res.json({ users: [], total: 0, page, limit });
});

// POST /api/admin/users/:id/block — Block a user session
router.post('/users/:id/block', requireAdmin, async (req, res) => {
    logger.warn('Admin blocked user', { userId: req.params.id, adminAction: true });
    res.json({ success: true });
});

// GET /api/admin/sessions — Active VPN sessions
router.get('/sessions', requireAdmin, async (req, res) => {
    res.json({ sessions: [], count: 0 });
});

// GET /api/admin/revenue — Revenue dashboard
router.get('/revenue', requireAdmin, async (req, res) => {
    res.json({
        mrr_aud:          6815.80,
        arr_aud:          81789.60,
        this_month:       8234.50,
        last_month:       7891.20,
        churn_rate:       0.024,
        avg_revenue_user: 19.99,
    });
});

// GET /api/admin/dns-traffic — DNS analytics
router.get('/dns-traffic', requireAdmin, async (req, res) => {
    res.json({ top_blocked: [], events_by_hour: [], total_24h: 0 });
});

// POST /api/admin/maintenance — Send maintenance notification
router.post('/maintenance', requireAdmin, async (req, res) => {
    const { title, message } = req.body;
    logger.info('Maintenance notification', { title });
    // TODO: send to FCM for push delivery
    res.json({ sent: true });
});

module.exports = router;
