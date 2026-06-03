'use strict';

const nodemailer = require('nodemailer');
const { logger } = require('../logger');

const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendInvoiceEmail({ to, invoiceNumber, pdfBuffer, invoiceData }) {
    const subject = `Tax Invoice ${invoiceNumber} — Sentinel Data Pty Ltd`;

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#07080A;padding:24px 32px;border-radius:8px 8px 0 0">
                <span style="color:#00FFCC;font-size:22px;font-weight:900">SENTINEL DATA</span>
            </div>
            <div style="background:#f9f9f9;padding:28px 32px;border:1px solid #eee">
                <p>Dear ${invoiceData.buyerName},</p>
                <p>Thank you for your purchase. Please find your GST tax invoice attached.</p>

                <table style="width:100%;border-collapse:collapse;margin:16px 0">
                    <tr><td style="padding:6px 0;color:#666">Invoice Number</td><td style="font-weight:bold">${invoiceNumber}</td></tr>
                    <tr><td style="padding:6px 0;color:#666">Package</td><td>${invoiceData.packageName}</td></tr>
                    <tr><td style="padding:6px 0;color:#666">Subtotal (ex-GST)</td><td>$${invoiceData.exGstAud} AUD</td></tr>
                    <tr><td style="padding:6px 0;color:#666">GST (10%)</td><td>$${invoiceData.gstAud} AUD</td></tr>
                    <tr style="border-top:2px solid #07080A"><td style="padding:8px 0;font-weight:bold">Total</td><td style="font-weight:bold;color:#07080A">$${invoiceData.totalAud} AUD</td></tr>
                </table>

                <p style="font-size:12px;color:#888">
                    Your data package will be made available via the Sentinel API within 24 hours.
                    This invoice serves as a valid tax invoice under the GST Act 1999 (Cth).
                </p>
            </div>
            <div style="background:#07080A;padding:14px 32px;border-radius:0 0 8px 8px;text-align:center">
                <span style="color:#8C92AC;font-size:11px">Sentinel Data Pty Ltd · ABN ${invoiceData.supplierAbn} · sentineldata.com.au</span>
            </div>
        </div>
    `;

    await transporter.sendMail({
        from:        `"${process.env.INVOICE_FROM_NAME}" <${process.env.INVOICE_FROM_EMAIL}>`,
        to,
        subject,
        html,
        attachments: [{
            filename:    `${invoiceNumber}.pdf`,
            content:     pdfBuffer,
            contentType: 'application/pdf',
        }],
    });

    logger.info('Invoice email sent', { to, invoiceNumber });
}

module.exports = { sendInvoiceEmail };
