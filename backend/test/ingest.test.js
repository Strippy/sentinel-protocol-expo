'use strict';
/**
 * Tests for the payload validation logic mirrored from sentinelIngest.ts.
 * Uses Node.js built-in test runner (no external dependencies).
 */
const { test } = require('node:test');
const assert   = require('node:assert/strict');

const REQUIRED_FIELDS   = ['token', 'date', 'domain_block_counts', 'session_count', 'schema_version'];
const REQUIRED_DOMAIN   = ['social_media', 'news', 'streaming', 'other'];
const PII_FIELDS        = ['ip','ip_address','email','name','phone','gps','lat','lng',
                           'latitude','longitude','device_id','imei','mac_address','user_id'];

function validatePayload(payload) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!(field in payload)) errors.push(`Missing required field: ${field}`);
  }
  const tokenStr = String(payload.token || '');
  const isExpo   = tokenStr.startsWith('expo-demo-');
  const isShort  = tokenStr.length === 16;
  if (payload.token && !isExpo && !isShort && !/^[a-f0-9]{64}$/i.test(tokenStr)) {
    errors.push('token must be a SHA-256 hex string or 16-char device token');
  }
  if (payload.date) {
    if (!/^\d{4}-\d{2}-\d{2}/.test(String(payload.date))) {
      errors.push('date must start with YYYY-MM-DD format');
    }
  }
  if (payload.domain_block_counts && typeof payload.domain_block_counts === 'object') {
    for (const field of REQUIRED_DOMAIN) {
      if (typeof payload.domain_block_counts[field] !== 'number') {
        errors.push(`domain_block_counts.${field} must be an integer`);
      }
    }
  }
  for (const pii of PII_FIELDS) {
    if (pii in payload) errors.push(`PII VIOLATION: Payload contains prohibited field: ${pii}`);
  }
  return errors;
}

const VALID_PAYLOAD = {
  token:              'a'.repeat(64),
  date:               '2026-06-03',
  schema_version:     '1.0',
  session_count:      3,
  domain_block_counts:{ social_media: 12, news: 4, streaming: 7, other: 2 },
};

test('valid payload passes with no errors', () => {
  assert.deepEqual(validatePayload(VALID_PAYLOAD), []);
});

test('missing required field raises error', () => {
  const { token: _, ...bad } = VALID_PAYLOAD;
  assert.ok(validatePayload(bad).some(e => e.includes('token')));
});

test('PII field raises violation error', () => {
  const bad = { ...VALID_PAYLOAD, email: 'user@example.com' };
  assert.ok(validatePayload(bad).some(e => e.includes('PII VIOLATION')));
});

test('expo-demo token is accepted', () => {
  const good = { ...VALID_PAYLOAD, token: 'expo-demo-abc123' };
  assert.deepEqual(validatePayload(good), []);
});

test('16-char device token is accepted', () => {
  const good = { ...VALID_PAYLOAD, token: 'abcd1234efgh5678' };
  assert.deepEqual(validatePayload(good), []);
});

test('invalid SHA-256 token is rejected', () => {
  const bad = { ...VALID_PAYLOAD, token: 'not-a-valid-token-xyz' };
  assert.ok(validatePayload(bad).length > 0);
});

test('bad date format is rejected', () => {
  const bad = { ...VALID_PAYLOAD, date: '03/06/2026' };
  assert.ok(validatePayload(bad).some(e => e.includes('date')));
});
