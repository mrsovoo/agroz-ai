/**
 * BiznesGO API router — /api/biznesgo
 *
 *   Public:        /meta, /auth/*
 *   Server-2-srv:  /bridge/*           (X-Bridge-Key)
 *   Merchant-only: /merchant, /dashboard, /products, /sales, /debts, /customers, /orders
 *                  (authenticate → requireMerchant; har bir so'rov merchant_id bilan cheklangan)
 */
const express = require('express');
const { authenticate, requireMerchant } = require('../../middleware/auth');

const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/bot', require('./bot'));
router.use('/bridge', require('./bridge'));
router.use('/', require('./merchant')); // /meta (public), /merchant (himoyalangan)

const guarded = [authenticate, requireMerchant];
router.use('/dashboard', guarded, require('./dashboard'));
router.use('/products', guarded, require('./products'));
router.use('/sales', guarded, require('./sales'));
router.use('/debts', guarded, require('./debts'));
router.use('/customers', guarded, require('./customers'));
router.use('/orders', guarded, require('./orders'));

module.exports = router;

