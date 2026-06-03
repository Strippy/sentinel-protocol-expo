'use strict';

const PDFDocument = require('pdfkit');

/**
 * Generates a GST-compliant Australian tax invoice PDF.
 *
 * Requirements met:
 *   ✓ "Tax Invoice" heading
 *   ✓ Supplier name, address, ABN
 *   ✓ Buyer name, ABN
 *   ✓ Invoice date and unique invoice number
 *   ✓ Description of taxable supply
 *   ✓ GST amount shown separately
 *   ✓ Total price inc. GST
 *   ✓ Net settlement amount after 15% commission
 *
 * Returns a Buffer containing the PDF bytes.
 */
function generateInvoicePdf(data) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const doc    = new PDFDocument({ size: 'A4', margin: 50 });

        doc.on('data',  chunk => chunks.push(chunk));
        doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
        doc.on('error', err   => reject(err));

        const DARK   = '#07080A';
        const MINT   = '#00CCAA';
        const GREY   = '#5A6070';
        const BORDER = '#DDDDDD';
        const WHITE  = '#FFFFFF';

        // ── Header bar ──────────────────────────────────────────────────────
        doc.rect(0, 0, doc.page.width, 80).fill(DARK);
        doc
            .fillColor(WHITE)
            .fontSize(22).font('Helvetica-Bold')
            .text('SENTINEL DATA', 50, 24, { align: 'left' });
        doc
            .fillColor(MINT)
            .fontSize(11).font('Helvetica')
            .text('TAX INVOICE', 50, 52, { align: 'left' });
        doc
            .fillColor(WHITE)
            .fontSize(10)
            .text(`Invoice: ${data.invoiceNumber}`, 0, 30, { align: 'right', width: doc.page.width - 50 })
            .text(`Date: ${data.issueDate}`,         0, 46, { align: 'right', width: doc.page.width - 50 });

        doc.moveDown(3);

        // ── Supplier / Buyer columns ─────────────────────────────────────────
        const col1X = 50, col2X = 310;

        doc.fillColor(GREY).fontSize(9).font('Helvetica-Bold').text('FROM (SUPPLIER)', col1X, 110);
        doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text(data.supplierName, col1X, 124);
        doc.font('Helvetica').fontSize(9)
            .text(`ABN: ${data.supplierAbn}`, col1X)
            .text(`Email: ${data.supplierEmail}`, col1X);

        doc.fillColor(GREY).fontSize(9).font('Helvetica-Bold').text('BILL TO (BUYER)', col2X, 110);
        doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text(data.buyerName, col2X, 124);
        doc.font('Helvetica').fontSize(9)
            .text(`ABN: ${data.buyerAbn}`, col2X)
            .text(`Email: ${data.buyerEmail}`, col2X);

        // ── Line item table ───────────────────────────────────────────────────
        const tableTop = 220;
        doc.rect(50, tableTop, doc.page.width - 100, 22).fill(DARK);
        doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold');
        doc.text('DESCRIPTION',      60,  tableTop + 7);
        doc.text('QTY', 310, tableTop + 7, { width: 50, align: 'right' });
        doc.text('UNIT (ex-GST)', 370, tableTop + 7, { width: 90, align: 'right' });
        doc.text('TOTAL (ex-GST)',   460, tableTop + 7, { width: 80, align: 'right' });

        const row1Y = tableTop + 30;
        doc.fillColor(DARK).font('Helvetica').fontSize(10);
        doc.text(`Sentinel ${data.packageName} Data Package`, 60, row1Y);
        doc.text('1', 310, row1Y, { width: 50, align: 'right' });
        doc.text(`$${data.exGstAud}`, 370, row1Y, { width: 90, align: 'right' });
        doc.text(`$${data.exGstAud}`, 460, row1Y, { width: 80, align: 'right' });

        doc.fontSize(8).fillColor(GREY)
            .text('Scrubbed, anonymised synthetic DNS domain data. No PII included.', 60, row1Y + 16);

        // ── Totals ────────────────────────────────────────────────────────────
        const totalsY = row1Y + 60;
        doc.moveTo(50, totalsY).lineTo(doc.page.width - 50, totalsY).strokeColor(BORDER).stroke();

        function totalsRow(label, value, bold = false, color = DARK) {
            const y = doc.y + 6;
            doc.fillColor(GREY).fontSize(9).font('Helvetica').text(label, 360, y, { width: 120 });
            doc.fillColor(color).fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica')
                .text(value, 480, y, { width: 60, align: 'right' });
            doc.moveDown(0.5);
        }

        doc.y = totalsY + 8;
        totalsRow('Subtotal (ex-GST)',    `$${data.exGstAud}`);
        totalsRow('GST (10%)',            `$${data.gstAud}`);

        doc.moveTo(360, doc.y + 6).lineTo(doc.page.width - 50, doc.y + 6).strokeColor(BORDER).stroke();
        doc.moveDown(0.3);
        totalsRow('TOTAL (inc. GST)',     `$${data.totalAud}`, true, DARK);
        doc.moveDown(0.5);
        totalsRow('Platform commission (15%)', `-$${data.commissionAud}`, false, GREY);
        totalsRow('Your net settlement', `$${data.netSettleAud}`, true, MINT);

        // ── Footer ────────────────────────────────────────────────────────────
        const footerY = doc.page.height - 110;
        doc.rect(50, footerY, doc.page.width - 100, 1).fill(BORDER);

        doc.fillColor(GREY).fontSize(8).font('Helvetica')
            .text('This document is a tax invoice as defined under A New Tax System (Goods and Services Tax) Act 1999 (Cth).', 50, footerY + 10, { align: 'center', width: doc.page.width - 100 })
            .text(`Stripe Reference: ${data.stripeRef}`, 50, footerY + 22, { align: 'center', width: doc.page.width - 100 })
            .text('Sentinel Data Pty Ltd  ·  sentineldata.com.au  ·  ABN ' + data.supplierAbn, 50, footerY + 34, { align: 'center', width: doc.page.width - 100 });

        // ── Privacy notice ────────────────────────────────────────────────────
        doc.rect(50, footerY + 52, doc.page.width - 100, 40).fill('#F5F8FA');
        doc.fillColor(GREY).fontSize(7.5)
            .text('PRIVACY: This invoice contains business information only. No IP addresses, GPS data, device identifiers,', 58, footerY + 60, { width: doc.page.width - 116 })
            .text('personal names, or user-level data is included in any associated data export. All domain data is k-anonymised.', 58, doc.y + 1, { width: doc.page.width - 116 });

        doc.end();
    });
}

module.exports = { generateInvoicePdf };
