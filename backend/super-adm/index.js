const express = require('express');
const router = express.Router();

const { router: authRouter } = require('./auth');
const adminsRouter = require('./admins');
const auditRouter = require('./audit');

// 1. Auth & 2FA
router.use('/auth', authRouter);

// 2. Adminlar va Rollar Boshqaruvi
router.use('/admins', adminsRouter);

// 3. Audit Jurnali & Maskalangan Ma'lumotlarni Ochish
router.use('/audit', auditRouter);

// Standart status / versiya
router.get('/version', (req, res) => {
  res.json({
    success: true,
    name: 'BiznesGO Super Admin API',
    app: 'BiznesGO Super Admin API',
    version: '1.0.0-phase1',
    phase: '1-bosqich: Poydevor (Auth, RBAC, ResourceTable, Audit)',
    environment: process.env.NODE_ENV || 'development',
    server_time: new Date().toISOString()
  });
});

module.exports = router;
