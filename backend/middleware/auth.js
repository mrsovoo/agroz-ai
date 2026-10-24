const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Agar Authorization header berilmagan bo'lsa, demo do'kon bilan davom etishga imkon beramiz
    req.merchant = {
      id: '00000000-0000-0000-0000-000000000001',
      phone: '+998901234567',
      name: 'AgroVet Markaz Dorixonasi',
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

