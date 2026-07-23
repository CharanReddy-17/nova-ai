const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const FREE_LIMIT = 50;

// ── Stripe client (optional — only if STRIPE_SECRET_KEY is set) ───────────────
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('💳 Stripe: enabled');
} else {
  console.log('💳 Stripe: not configured (set STRIPE_SECRET_KEY to enable)');
}

// @route GET /api/payments/status
// @desc  Get current user's plan + daily usage
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.resetDailyCountIfNeeded();
    await user.save();

    res.json({
      plan: user.plan,
      dailyMessageCount: user.dailyMessageCount,
      dailyLimit: user.plan === 'pro' ? null : FREE_LIMIT,
      remaining: user.plan === 'pro' ? null : Math.max(0, FREE_LIMIT - user.dailyMessageCount),
      isAtLimit: user.isAtLimit(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get plan status.' });
  }
});

// @route POST /api/payments/create-checkout
// @desc  Create a Stripe checkout session
router.post('/create-checkout', protect, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payments not configured. Add STRIPE_SECRET_KEY to enable.' });
  }

  try {
    const user = await User.findById(req.user._id);
    let customerId = user.stripeCustomerId;

    // Create or reuse Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{
        price: process.env.STRIPE_PRO_PRICE_ID, // Set in Render dashboard
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?upgrade=success`,
      cancel_url:  `${process.env.FRONTEND_URL}/dashboard?upgrade=cancelled`,
      metadata: { userId: user._id.toString() },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session.' });
  }
});

// @route POST /api/payments/webhook
// @desc  Stripe webhook — update user plan on payment
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.sendStatus(400);

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId  = session.metadata?.userId;
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          plan: 'pro',
          stripeSubscriptionId: session.subscription,
        });
        console.log(`✅ User ${userId} upgraded to Pro`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      await User.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        { plan: 'free', stripeSubscriptionId: null }
      );
      console.log('⬇️  Subscription cancelled — downgraded to free');
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err.message);
    res.status(500).json({ error: 'Webhook handler failed.' });
  }
});

// @route POST /api/payments/cancel
// @desc  Cancel subscription
router.post('/cancel', protect, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments not configured.' });

  try {
    const user = await User.findById(req.user._id);
    if (!user.stripeSubscriptionId) return res.status(400).json({ error: 'No active subscription.' });

    await stripe.subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: true });
    res.json({ message: 'Subscription will cancel at end of billing period.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel subscription.' });
  }
});

module.exports = router;
