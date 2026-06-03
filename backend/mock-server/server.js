'use strict';
/**
 * Sentinel Protocol — Mock Ingest Server
 *
 * Simulates the production ingest endpoint for local development and testing.
 * Receives anonymised JSON payloads, validates schema, returns confirmation.
 * Mirrors the validation logic in functions/sentinelIngest.ts.
 *
 * Run: node mock-server/server.js
 * Port: 3001 (avoids conflict with the B2B payment server on 3000)
 */

const http = require('http');

const REQUIRED_FIELDS        = ['token', 'date', 'domain_block_counts', 'session_count', 'schema_version'];
const REQUIRED_DOMAIN_FIELDS = ['social_media', 'news', 'streaming', 'other'];
const PII_FIELDS = [
  'ip','ip_address','email','name','phone','gps','lat','lng',
  'latitude','longitude','device_id','imei','mac_address','user_id',
];

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

  if (payload.date && !/^\d{4}-\d{2}-\d{2}/.test(String(payload.date))) {
    errors.push('date must start with YYYY-MM-DD format');
  }

  if (payload.domain_block_counts) {
    for (const field of REQUIRED_DOMAIN_FIELDS) {
      if (typeof payload.domain_block_counts[field] !== 'number') {
        errors.push(`domain_block_counts.${field} must be an integer`);
      }
    }
    const extra = Object.keys(payload.domain_block_counts)
      .filter(k => !REQUIRED_DOMAIN_FIELDS.includes(k));
    if (extra.length > 0) {
      errors.push(`Unexpected fields in domain_block_counts: ${extra.join(', ')}`);
    }
  }

  for (const pii of PII_FIELDS) {
    if (pii in payload) {
      errors.push(`PII VIOLATION: Payload contains prohibited field: ${pii}`);
    }
  }

  return errors;
}

// ── Stub yield calculation (mirrors sentinelIngest.ts logic) ──────────────────

function stubYield(payload) {
  const signals = payload.signals || {};
  const keys    = Object.keys(signals);
  if (keys.length === 0) return { amount_aud: 0.01, category: 'App Usage', buyer: 'Ad-Tech' };
  const topKey  = keys.sort((a, b) => (signals[b] || 0) - (signals[a] || 0))[0];
  const score   = Math.max(...Object.values(signals).map(Number)) / 100;
  const amount  = Math.round(Math.max(0.005, score * 0.10) * 10000) / 10000;
  const catMap  = { app_usage: 'App Usage', interest_vec: 'Browsing Patterns', region_tier: 'Location Signals' };
  const buyMap  = { app_usage: 'Ad-Tech', interest_vec: 'Market Research', region_tier: 'Retail Analytics' };
  return {
    amount_aud: amount,
    category:   catMap[topKey] || 'App Usage',
    buyer:      buyMap[topKey] || 'Ad-Tech',
  };
}

// ── HTTP server ───────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Sentinel-Schema-Version, X-Sentinel-Client');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.method === 'GET' && (req.url === '/health' || req.url === '/')) {
    res.writeHead(200);
    res.end(JSON.stringify({
      status:  'ok',
      server:  'Sentinel Protocol Mock Ingest v3.0',
      version: '3.0.0-mock',
      endpoints: {
        ingest:  'POST /functions/sentinelIngest',
        health:  'GET  /health',
      },
      uptime_seconds: process.uptime(),
    }, null, 2));
    return;
  }

  if (req.method === 'POST' && req.url === '/functions/sentinelIngest') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const receivedAt = new Date().toISOString();
      const platform   = req.headers['x-sentinel-client'] || 'unknown';

      try {
        let payload = JSON.parse(body);

        // Handle deletion requests
        if (payload.type === 'deletion_request') {
          const token = String(payload.token || '');
          console.log(`[DELETION_REQUEST] token=${token.substring(0,8)}...`);
          res.writeHead(200);
          res.end(JSON.stringify({
            status:       'deletion_queued',
            message:      'Data deletion request queued. Processed within 30 days (APP/GDPR).',
            token_prefix: token.substring(0, 8) + '...',
            received_at:  receivedAt,
            reference:    `DEL-${Date.now()}`,
          }, null, 2));
          return;
        }

        // Normalise
        if (payload.signals && !payload.domain_block_counts) {
          payload.domain_block_counts = { social_media: 0, news: 0, streaming: 0, other: 0 };
        }
        if (payload.timestamp && !payload.date) {
          payload.date = new Date(Number(payload.timestamp)).toISOString().slice(0, 10);
        }
        if (!payload.schema_version) payload.schema_version = '1.0';
        if (!payload.session_count)  payload.session_count  = 1;

        const errors   = validatePayload(payload);
        const tokenStr = String(payload.token || '');
        const accepted = errors.length === 0;

        console.log(`\n[${receivedAt}] ${accepted ? '✓ ACCEPTED' : '✗ REJECTED'} | platform=${platform}`);
        console.log(`  token: ${tokenStr.substring(0, 8)}... | sessions: ${payload.session_count} | ghost: ${payload.is_ghost_session ? 'YES' : 'NO'}`);
        if (!accepted) console.log(`  errors: ${errors.join(' | ')}`);

        if (accepted) {
          const yld = stubYield(payload);
          console.log(`  yield: A$${yld.amount_aud} | cat: ${yld.category} | buyer: ${yld.buyer}`);
          res.writeHead(200);
          res.end(JSON.stringify({
            status:           'accepted',
            message:          'Payload validated and yield credited',
            received_at:      receivedAt,
            schema_version:   payload.schema_version,
            token_prefix:     tokenStr.substring(0, 8) + '...',
            platform,
            is_ghost_session: payload.is_ghost_session || false,
            validation: {
              pii_check:       'PASSED',
              schema_check:    'PASSED',
              token_format:    'VALID',
              required_fields: 'ALL_PRESENT',
            },
            domain_summary: payload.domain_block_counts,
            session_count:  payload.session_count,
            yield: {
              ...yld,
              credited_at: receivedAt,
            },
          }, null, 2));
        } else {
          res.writeHead(400);
          res.end(JSON.stringify({ status: 'rejected', message: 'Payload failed validation', errors }, null, 2));
        }
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON body' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n  Sentinel Protocol Mock Ingest Server`);
  console.log(`  POST /functions/sentinelIngest  — receive anonymised payload`);
  console.log(`  GET  /health                    — server health check`);
  console.log(`  Port: ${PORT}\n`);
});
