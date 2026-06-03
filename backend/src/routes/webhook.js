'use strict';

const express = require('express');
const stripe  = require('../services/stripeClient');
const { logger } = require('../logger');

const router = express.Router();

/**
 * POST /api/webhook
 *
 * Stripe sends payment lifecycle events here.
 * We verify the webhook signature before processing.
 *
 * Events handled:
 *   payment_intent.succeeded        — redundant fulfilment safety net
 *   payment_intent.payment_failed   — log and alert
 *   charge.dispute.created          — fraud alert
 *   charge.refunded                 — record refund
 */
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET,
        );
    } catch (err) {
        logger.warn('Webhook signature verification failed', { error: err.message });
        return res.status(400).json({ error: 'Invalid signature' });
    }

    logger.info('Stripe webhook received', { type: event.type, id: event.id });

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            case 'charge.dispute.created':
                logger.warn('DISPUTE OPENED', {
                    chargeId: event.data.object.charge,
                    amount:   event.data.object.amount,
                    reason:   event.data.object.reason,
                });
                // TODO: notify ops team via SNS/Slack
                break;

            case 'charge.refunded':
                logger.info('Charge refunded', {
                    chargeId: event.data.object.id,
                    amount:   event.data.object.amount_refunded,
                });
                break;

            default:
                logger.debug('Unhandled webhook event', { type: event.type });
        }

        res.json({ received: true });
    } catch (err) {
        logger.error('Webhook handler error', { type: event.type, error: err.message });
        res.status(500).json({ error: 'Handler failed' });
    }
});

async function handlePaymentSucceeded(pi) {
    if (pi.metadata?.type !== 'b2b_synthetic_data') return;
    if (pi.metadata?.fulfilled === 'true') return;
    // If the confirm-order endpoint was not called (e.g. app crashed),
    // the webhook acts as a safety net. Trigger fulfilment via internal call.
    logger.info('Safety-net: payment_intent.succeeded', { id: pi.id, abn: pi.metadata?.abn });
    // TODO: enqueue a fulfilment job via SQS
}

async function handlePaymentFailed(pi) {
    logger.warn('Payment failed', {
        id:             pi.id,
        lastError:      pi.last_payment_error?.message,
        abn:            pi.metadata?.abn,
        contact_email:  pi.metadata?.contact_email,
    });
    // TODO: send failure email to contact_email
}

module.exports = router;
