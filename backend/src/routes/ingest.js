'use strict';
const express    = require('express');
const statsStore = require('../services/statsStore');
const router     = express.Router();

router.post('/', (req, res) => {
  const { events = [], sessionId } = req.body || {};
  if (!Array.isArray(events)) return res.status(400).json({ error: 'events must be an array' });
  statsStore.record(events, sessionId);
  res.json({ ok: true, accepted: events.length });
});

module.exports = router;
