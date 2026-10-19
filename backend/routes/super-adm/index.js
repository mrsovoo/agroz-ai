/**
 * Super Admin Master Router — /api/super-adm
 * Barcha yo'llar backend/middleware/adminAuth.js (requireSuperAdmin) bilan himoyalangan.
 */
const express = require('express');
const { requireSuperAdmin } = require('../../middleware/adminAuth');

const router = express.Router();

const authModule = require('./auth');

// 1. Ochiq kirish endpointlari (Login va Token berish)
router.post('/login', authModule.loginHandler);
router.use('/auth', authModule.publicRouter);

// 2. Barcha qolgan super admin route'larini requireSuperAdmin guard bilan himoyalash
router.use(requireSuperAdmin);

// 3. Himoyalangan admin ma'lumotlari
router.get('/me', authModule.meHandler);
router.get('/auth/me', authModule.meHandler);

router.use('/stats', require('./stats'));
router.use('/merchants', require('./merchants'));
router.use('/broadcast', require('./broadcast'));
router.use('/archive', require('./archive'));
router.use('/support', require('./support'));
router.use('/regions', require('./regions'));

module.exports = router;

