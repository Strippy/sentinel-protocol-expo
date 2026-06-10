'use strict';
const express = require('express');
const stripe  = require('../services/stripeClient');
const router  = express.Router();

const PLANS = {
  pro:   { priceEnv: 'STRIPE_PRICE_PRO',   label: 'PRO — $10/mo' },
  elite: { priceEnv: 'STRIPE_PRICE_ELITE', label: 'ELITE — $30/mo' },
};

router.post('/', async (req, res) => {
  const { plan, email } = req.body || {};
  const cfg = PLANS[plan];
  if (!cfg) return res.status(400).json({ error: 'Unknown plan. Must be pro or elite.' });

  const priceId = process.env[cfg.priceEnv];
  if (!priceId) return res.status(503).json({ error: `Stripe price not configured for plan: ${plan}` });

  try {
    const origin  = process.env.APP_URL || 'https://sentinel-protocol-expo.vercel.app';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      ...(email && { customer_email: email }),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/plans?subscribed=${plan}`,
      cancel_url:  `${origin}/plans`,
    });
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
