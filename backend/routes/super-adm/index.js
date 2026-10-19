/**
 * Super Admin Master Router — /api/super-adm
 * Barcha yo'llar backend/middleware/adminAuth.js (requireSuperAdmin) bilan himoyalangan.
 */
const express = require('express');
const { requireSuperAdmin } = require('../../middleware/adminAuth');

const router = express.Router();

// Barcha super admin route'larini requireSuperAdmin guard bilan himoyalash
router.use(requireSuperAdmin);

router.use('/stats', require('./stats'));
router.use('/merchants', require('./merchants'));
router.use('/broadcast', require('./broadcast'));
router.use('/archive', require('./archive'));
router.use('/support', require('./support'));

module.exports = router;

