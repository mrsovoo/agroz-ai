const express = require('express');
const router = express.Router();

const { router: authRouter } = require('./auth');
const adminsRouter = require('./admins');
const auditRouter = require('./audit');
const dashboardRouter = require('./dashboard');
const tenantsRouter = require('./tenants');

// 1. Auth & 2FA
router.use('/auth', authRouter);

// 2. Adminlar va Rollar Boshqaruvi
router.use('/admins', adminsRouter);

// 3. Audit Jurnali & Maskalangan Ma'lumotlarni Ochish
router.use('/audit', auditRouter);

// 4. Katta Super Admin Data Paneli (Metrikalar & Tahlil)
router.use('/dashboard', dashboardRouter);

// 5. B2B Dorixonalar va Bizneslar Boshqaruvi
router.use('/tenants', tenantsRouter);

// Standart status / versiya
router.get('/version', (req, res) => {
  res.json({
    success: true,
    name: 'BiznesGO Super Admin API',
    app: 'BiznesGO Super Admin API',
    version: '1.2.0-phase2',
    phase: '2-bosqich: Boshqaruv & Katta Data Paneli (Dashboard, Dorixonalar, Daromad)',
    environment: process.env.NODE_ENV || 'development',
    server_time: new Date().toISOString()
  });
});

module.exports = router;
