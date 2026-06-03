'use strict';

const express  = require('express');
const Joi      = require('joi');
const { v4: uuidv4 } = require('uuid');
const stripe   = require('../services/stripeClient');
const { validateAbn }       = require('../services/abnService');
const { generateInvoicePdf } = require('../services/invoiceService');
const { uploadToS3 }         = require('../services/s3Service');
const { sendInvoiceEmail }   = require('../services/emailService');
const { logger }             = require('../logger');
const { requireApiKey }      = require('../middleware/auth');

const router = express.Router();

// ─── Package definitions (server-authoritative — client cannot set price) ──────

const PACKAGES = {
    STARTER: {
        id:              'STARTER',
        name:            'Starter',
        amountCentsExGst: 4900,
        domainLimit:     1_000,
        retentionDays:   30,
    },
    PROFESSIONAL: {
        id:              'PROFESSIONAL',
        name:            'Professional',
        amountCentsExGst: 19900,
        domainLimit:     25_000,
        retentionDays:   90,
    },
    ENTERPRISE: {
        id:              'ENTERPRISE',
        name:            'Enterprise',
        amountCentsExGst: 99900,
        domainLimit:     null,      // unlimited
        retentionDays:   365,
    },
};

const GST_RATE        = parseFloat(process.env.GST_RATE        || '0.10');
const COMMISSION_RATE = parseFloat(process.env.COMMISSION_RATE || '0.15');

function calcAmounts(pkg) {
    const exGst      = pkg.amountCentsExGst;
    const gst        = Math.round(exGst * GST_RATE);
    const total      = exGst + gst;
    const commission = Math.round(exGst * COMMISSION_RATE);
    const netSettle  = exGst - commission;
    return { exGst, gst, total, commission, netSettle };
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const createPaymentSchema = Joi.object({
    abn:           Joi.string().pattern(/^\d{11}$/).required(),
    business_name: Joi.string().min(2).max(200).required(),
    contact_email: Joi.string().email().required(),
    package_id:    Joi.string().valid('STARTER', 'PROFESSIONAL', 'ENTERPRISE').required(),
    currency:      Joi.string().valid('aud').default('aud'),
    // amount_cents from client is IGNORED — we use server-side values
});

const confirmOrderSchema = Joi.object({
    payment_intent_id: Joi.string().pattern(/^pi_/).required(),
    abn:               Joi.string().pattern(/^\d{11}$/).required(),
    contact_email:     Joi.string().email().required(),
});

// ─── POST /api/b2b/create-payment ────────────────────────────────────────────

router.post('/create-payment', requireApiKey, async (req, res) => {
    // 1. Validate input
    const { error, value } = createPaymentSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            error:   'Validation failed',
            details: error.details[0].message,
        });
    }

    // 2. Validate ABN against ATO
    const abnResult = validateAbn(value.abn);
    if (!abnResult.isValid) {
        return res.status(400).json({
            error: 'Invalid ABN',
            code:  'ABN_INVALID',
        });
    }

    // 3. Look up package — price is SERVER-AUTHORITATIVE
    const pkg = PACKAGES[value.package_id];
    if (!pkg) return res.status(400).json({ error: 'Unknown package' });

    const amounts      = calcAmounts(pkg);
    const invoiceNumber = `SEN-${Date.now()}-${uuidv4().slice(0,6).toUpperCase()}`;

    try {
        // 4. Create Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount:   amounts.total,         // total inc. GST in cents
            currency: 'aud',
            automatic_payment_methods: { enabled: true },
            metadata: {
                abn:            value.abn,
                abn_formatted:  abnResult.formatted,
                business_name:  value.business_name,
                contact_email:  value.contact_email,
                package_id:     pkg.id,
                package_name:   pkg.name,
                invoice_number: invoiceNumber,
                ex_gst_cents:   String(amounts.exGst),
                gst_cents:      String(amounts.gst),
                commission_cents: String(amounts.commission),
                net_settle_cents: String(amounts.netSettle),
                type:           'b2b_synthetic_data',
            },
        });

        logger.info('PaymentIntent created', {
            id:        paymentIntent.id,
            amount:    amounts.total,
            packageId: pkg.id,
            abn:       value.abn,
        });

        return res.json({
            client_secret:     paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            invoice_number:    invoiceNumber,
        });

    } catch (err) {
        logger.error('Stripe PaymentIntent creation failed', { error: err.message });
        return res.status(502).json({ error: 'Payment provider error — please retry' });
    }
});

// ─── POST /api/b2b/confirm-order ─────────────────────────────────────────────

router.post('/confirm-order', requireApiKey, async (req, res) => {
    const { error, value } = confirmOrderSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: 'Validation failed', details: error.details[0].message });
    }

    try {
        // 1. Retrieve PaymentIntent — verify status server-side (NEVER trust client)
        const pi = await stripe.paymentIntents.retrieve(value.payment_intent_id);

        if (pi.status !== 'succeeded') {
            return res.status(402).json({
                error: `Payment not completed — status: ${pi.status}`,
                code:  'PAYMENT_INCOMPLETE',
            });
        }

        // 2. Guard against double-fulfilment
        if (pi.metadata.fulfilled === 'true') {
            return res.status(200).json({
                order_id:       pi.metadata.order_id,
                invoice_url:    pi.metadata.invoice_url || '',
                invoice_number: pi.metadata.invoice_number,
                status:         'already_fulfilled',
            });
        }

        const orderId = `ORD-${uuidv4()}`;
        const pkg     = PACKAGES[pi.metadata.package_id];
        const amounts = calcAmounts(pkg);

        // 3. Generate GST-compliant PDF invoice
        const invoiceData = {
            invoiceNumber:  pi.metadata.invoice_number,
            issueDate:      new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' }),
            supplierAbn:    process.env.SUPPLIER_ABN,
            supplierName:   process.env.SUPPLIER_NAME,
            supplierEmail:  process.env.INVOICE_FROM_EMAIL,
            buyerAbn:       pi.metadata.abn_formatted,
            buyerName:      pi.metadata.business_name,
            buyerEmail:     pi.metadata.contact_email,
            packageName:    pkg.name,
            exGstAud:       (amounts.exGst / 100).toFixed(2),
            gstAud:         (amounts.gst   / 100).toFixed(2),
            totalAud:       (amounts.total  / 100).toFixed(2),
            commissionAud:  (amounts.commission / 100).toFixed(2),
            netSettleAud:   (amounts.netSettle  / 100).toFixed(2),
            stripeRef:      pi.id,
        };

        const pdfBuffer = await generateInvoicePdf(invoiceData);

        // 4. Upload encrypted PDF to S3
        const s3Key    = `invoices/${orderId}/${pi.metadata.invoice_number}.pdf`;
        const invoiceUrl = await uploadToS3(pdfBuffer, s3Key);

        // 5. Email invoice to buyer
        await sendInvoiceEmail({
            to:             pi.metadata.contact_email,
            invoiceNumber:  pi.metadata.invoice_number,
            pdfBuffer,
            invoiceData,
        });

        // 6. Mark PaymentIntent as fulfilled (idempotency guard)
        await stripe.paymentIntents.update(pi.id, {
            metadata: {
                ...pi.metadata,
                fulfilled:    'true',
                order_id:     orderId,
                invoice_url:  invoiceUrl,
                fulfilled_at: new Date().toISOString(),
            },
        });

        logger.info('Order fulfilled', {
            orderId,
            packageId: pkg.id,
            abn:       pi.metadata.abn,
            total:     amounts.total,
        });

        return res.json({
            order_id:       orderId,
            invoice_url:    invoiceUrl,
            invoice_number: pi.metadata.invoice_number,
            status:         'fulfilled',
        });

    } catch (err) {
        logger.error('Order confirmation failed', { error: err.message, stack: err.stack });
        return res.status(500).json({ error: 'Order confirmation failed — contact support.' });
    }
});

module.exports = router;
