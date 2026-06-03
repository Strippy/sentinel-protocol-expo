'use strict';
module.exports = require('stripe')(process.env.STRIPE_SECRET_KEY, {
    apiVersion:     '2024-06-20',
    appInfo: { name: 'Sentinel Data B2B', version: '1.0.0' },
});
