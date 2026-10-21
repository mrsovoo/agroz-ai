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

// 3. Himoyalangan admin ma'lumotlari va sozlamalari
router.get('/me', authModule.meHandler);
router.get('/auth/me', authModule.meHandler);
router.put('/credentials', authModule.updateCredentialsHandler);
router.post('/credentials', authModule.updateCredentialsHandler);
router.put('/auth/credentials', authModule.updateCredentialsHandler);

router.use('/stats', require('./stats'));
router.use('/merchants', require('./merchants'));
router.use('/broadcast', require('./broadcast'));
router.use('/archive', require('./archive'));
router.use('/support', require('./support'));
router.use('/regions', require('./regions'));

module.exports = router;

