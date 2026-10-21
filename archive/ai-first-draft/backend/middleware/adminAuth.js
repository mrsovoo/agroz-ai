/**
 * Super Admin Guard Middleware
 * Faqat role === 'super_admin' yoki to'g'ri X-Admin-Key / Bearer kalitli so'rovlarni o'tkazadi.
 * Ruxsatsiz so'rovlar:
 *   - Autentifikatsiya yo'q bo'lsa: 401 Unauthorized
 *   - Role super_admin bo'lmasa: 403 Forbidden (SUPER_ADMIN_REQUIRED)
 */
const crypto = require('crypto');
const config = require('../config');
const { query } = require('../db/pool');
const { HttpError } = require('../lib/errors');
const { verifyToken } = require('../lib/security');

function timingSafeMatch(candidate, secret) {
  if (!candidate || !secret) return false;
  try {
    const a = Buffer.from(String(candidate));
    const b = Buffer.from(String(secret));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function requireSuperAdmin(req, _res, next) {
  try {
    // 1. X-Admin-Key yoki X-Bridge-Key tekshiruvi
    const adminKey = req.get('x-admin-key') || req.get('x-bridge-key');
    const validKeys = [config.adminKey, config.adminPassword, config.bridgeKey].filter(Boolean);

    if (adminKey && validKeys.some((k) => timingSafeMatch(adminKey, k))) {
      req.admin = { role: 'super_admin', via: 'admin_key' };
      return next();
    }

    // 2. Authorization: Bearer <token> tekshiruvi
    const authHeader = req.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const bearer = authHeader.slice(7).trim();

      // Agar bearer token admin key yoki admin password bilan to'g'ridan-to'g'ri teng bo'lsa
      if (validKeys.some((k) => timingSafeMatch(bearer, k))) {
        req.admin = { role: 'super_admin', via: 'bearer_admin_key' };
        return next();
      }

      // JWT / HMAC sessiya tokeni bo'lsa
      const payload = verifyToken(bearer);
      if (payload) {
        if (payload.role === 'super_admin') {
          req.admin = { userId: payload.uid, role: 'super_admin', via: payload.via };
          return next();
        }

        // Baza bo'yicha foydalanuvchi roli super_admin ekanligini tekshiramiz
        if (payload.uid) {
          const { rows } = await query('SELECT id, role, phone FROM users WHERE id = $1', [payload.uid]);
          const user = rows[0];
          if (user && user.role === 'super_admin') {
            req.admin = { userId: user.id, role: 'super_admin', phone: user.phone };
            return next();
          }
        }

        // Token mavjud, lekin roli super_admin emas
        throw new HttpError(403, 'Ushbu amal faqat Super Admin uchun ruxsat etilgan', 'SUPER_ADMIN_REQUIRED');
      }
    }

    // Autentifikatsiya ma'lumotlari umuman berilmagan
    throw new HttpError(401, 'Super Admin autentifikatsiyasi talab qilinadi (X-Admin-Key yoki Bearer token)', 'ADMIN_AUTH_REQUIRED');
  } catch (err) {
    next(err);
  }
}

module.exports = { requireSuperAdmin, timingSafeMatch };

