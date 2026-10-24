const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const isProduction = process.env.NODE_ENV === 'production';

  // Sektor sarlavhasi (agar frontend tanlagan bo'lsa)
  const headerSector = req.headers['x-sector-type'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Production muhitida tokensiz kirishga ruxsat yo'q
    if (isProduction) {
      return res.status(401).json({ error: 'Avtorizatsiyadan o\'tilmagan. Iltimos, tizimga kiring.' });
    }

    // Lokal ishlab chiqish (Local Dev) uchun universal tenant konteksti:
    const devTenantId = '00000000-0000-0000-0000-000000000001';
    const sector = headerSector || 'agro_vet';

    req.tenant = {
      id: devTenantId,
      name: 'BiznesGO Lokal Sinov',
      phone: '+998901234567',
      sector_type: sector,
      plan: 'standard'
    };

    req.user = {
      id: '00000000-0000-0000-0000-000000000010',
      tenant_id: devTenantId,
      full_name: 'Bosh Administrator',
      role_code: 'owner'
    };

    // Orqaga moslik (Oldingi merchant middleware)
    req.merchant = {
      id: devTenantId,
      tenant_id: devTenantId,
      phone: '+998901234567',
      name: 'BiznesGO Lokal Sinov',
      business_type: sector,
      sector_type: sector
    };

    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecret);
    const sector = headerSector || decoded.sector_type || decoded.business_type || 'agro_vet';
    const tenantId = decoded.tenant_id || decoded.id;

    req.tenant = {
      id: tenantId,
      name: decoded.name || 'BiznesGO Do\'kon',
      phone: decoded.phone,
      sector_type: sector,
      plan: decoded.plan || 'standard'
    };

    req.user = {
      id: decoded.user_id || decoded.id,
      tenant_id: tenantId,
      full_name: decoded.full_name || decoded.name,
      role_code: decoded.role_code || 'owner'
    };

    // Orqaga moslik
    req.merchant = {
      ...decoded,
      id: tenantId,
      tenant_id: tenantId,
      business_type: sector,
      sector_type: sector
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Yaroqsiz yoki muddati o\'tgan token' });
  }
}

module.exports = authMiddleware;
