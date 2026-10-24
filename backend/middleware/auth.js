const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Production muhitida hech qanday demo do'konga ruxsat yo'q
    if (isProduction) {
      return res.status(401).json({ error: 'Avtorizatsiyadan o\'tilmagan. Iltimos, tizimga kiring.' });
    }

    // Faqat lokal ishlab chiqish (Local Dev) uchun:
    req.merchant = {
      id: '00000000-0000-0000-0000-000000000001',
      phone: '+998901234567',
      name: 'Agro-Vet Lokal Sinov',
      business_type: 'agro_vet'
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.merchant = {
      ...decoded,
      business_type: 'agro_vet' // Qat'iy Agro-Vet qulflangan
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Yaroqsiz yoki muddati o\'tgan token' });
  }
}

module.exports = authMiddleware;

