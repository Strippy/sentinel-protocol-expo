'use strict';
const express = require('express');
const router  = express.Router();

router.get('/', (req, res) => {
  res.json({
    status:        'live',
    ts:            new Date().toISOString(),
    nodeVersion:   process.version,
    env:           process.env.NODE_ENV || 'production',
    totalBlocked:  0,
    totalSessions: 0,
    topDomains:    [],
  });
});

module.exports = router;
