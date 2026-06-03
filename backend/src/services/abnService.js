'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// abnService.js — Australian Business Number validator (ATO algorithm)
// ─────────────────────────────────────────────────────────────────────────────

const WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

function validateAbn(raw) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 11) return { isValid: false };

    const d = digits.split('').map(Number);
    d[0] -= 1;
    const sum = WEIGHTS.reduce((acc, w, i) => acc + w * d[i], 0);
    const isValid = sum % 89 === 0;
    const formatted = isValid
        ? `${digits.slice(0,2)} ${digits.slice(2,5)} ${digits.slice(5,8)} ${digits.slice(8,11)}`
        : digits;
    return { isValid, formatted };
}

module.exports = { validateAbn };
