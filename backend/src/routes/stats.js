'use strict';
const express    = require('express');
const statsStore = require('../services/statsStore');
const router     = express.Router();

router.get('/', (req, res) => {
  res.json({
    status:      'live',
    ts:          new Date().toISOString(),
    nodeVersion: process.version,
    env:         process.env.NODE_ENV || 'production',
    ...statsStore.snapshot(),
  });
});

module.exports = router;
