/**
 * Super Admin Archive Management API — /api/super-adm/archive
 * Neon DB dagi barcha foydalanuvchilar (users, merchants, specialists) va ularning ro'yxatdan o'tish tarixi
 */
const express = require('express');
const { query } = require('../../db/pool');
const { HttpError, asyncHandler } = require('../../lib/errors');
const v = require('../../lib/validate');

const router = express.Router();

/**
 * GET /api/super-adm/archive
 * Barcha ro'yxatdan o'tganlar va arxivlangan profillar
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const search = (req.query.search || '').trim();
    const type = (req.query.type || '').trim(); // 'all', 'merchant', 'specialist', 'user', 'archived'
    const source = (req.query.source || '').trim(); // 'all', 'biznesgo_bot', 'agroz_auth_bot'
    const status = (req.query.status || '').trim(); // 'all', 'active', 'archived', 'blocked', 'inactive'
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 500);
    const offset = Math.max(Number(req.query.offset || 0), 0);

    const where = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      where.push(`(name ILIKE $${params.length} OR owner_name ILIKE $${params.length} OR phone ILIKE $${params.length} OR telegram_id ILIKE $${params.length})`);
    }

    if (type === 'merchant') {
      where.push(`role = 'merchant'`);
    } else if (type === 'specialist') {
      where.push(`role = 'specialist'`);
    } else if (type === 'user') {
      where.push(`role = 'user'`);
    } else if (type === 'archived') {
      where.push(`is_archived = true`);
    }

    if (source && source !== 'all') {
      params.push(source);
      where.push(`source = $${params.length}`);
    }

    if (status && status !== 'all') {
      params.push(status);
      where.push(`status = $${params.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const baseSql = `
      WITH unified_archive AS (
        SELECT 
          ('m_' || m.id) AS id,
          m.store_name AS name,
          u.name AS owner_name,
          m.phone,
          u.telegram_id::text AS telegram_id,
          m.business_type,
          'merchant' AS role,
          'biznesgo_bot' AS source,
          CASE WHEN m.is_archived = true THEN 'archived' WHEN m.is_active = true THEN 'active' ELSE 'blocked' END AS status,
          COALESCE(m.is_archived, false) AS is_archived,
          m.id AS merchant_id,
          m.created_at,
          m.archived_at
        FROM merchants m
        JOIN users u ON u.id = m.user_id

        UNION ALL

        SELECT 
          ('s_' || s.id) AS id,
          COALESCE(s.organization, s.name) AS name,
          s.name AS owner_name,
          s.phone,
          s.telegram_id::text AS telegram_id,
          s.role AS business_type,
          'specialist' AS role,
          'agroz_auth_bot' AS source,
          CASE WHEN s.is_active = true THEN 'active' ELSE 'inactive' END AS status,
          false AS is_archived,
          NULL::int AS merchant_id,
          s.created_at,
          NULL::timestamp AS archived_at
        FROM specialists s

        UNION ALL

        SELECT 
          ('u_' || u.id) AS id,
          COALESCE(u.name, 'Foydalanuvchi') AS name,
          u.name AS owner_name,
          u.phone,
          u.telegram_id::text AS telegram_id,
          'user' AS business_type,
          'user' AS role,
          'agroz_auth_bot' AS source,
          CASE WHEN u.bot_blocked = true THEN 'blocked' ELSE 'active' END AS status,
          false AS is_archived,
          NULL::int AS merchant_id,
          u.created_at,
          NULL::timestamp AS archived_at
        FROM users u
        WHERE NOT EXISTS (SELECT 1 FROM merchants m WHERE m.user_id = u.id)
          AND NOT EXISTS (SELECT 1 FROM specialists s WHERE s.telegram_id = u.telegram_id AND u.telegram_id IS NOT NULL)
      )
    `;

    const listSql = `
      ${baseSql}
      SELECT *
        FROM unified_archive
      ${whereClause}
      ORDER BY 
        CASE WHEN is_archived THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countSql = `
      ${baseSql}
      SELECT COUNT(*)::int AS total
        FROM unified_archive
      ${whereClause}
    `;

    const statsSql = `
      ${baseSql}
      SELECT 
        COUNT(*)::int AS total_all,
        COUNT(*) FILTER (WHERE is_archived = true)::int AS total_archived,
        COUNT(*) FILTER (WHERE role = 'merchant')::int AS total_merchants,
        COUNT(*) FILTER (WHERE role = 'specialist')::int AS total_specialists,
        COUNT(*) FILTER (WHERE role = 'user')::int AS total_users,
        COUNT(*) FILTER (WHERE source = 'biznesgo_bot')::int AS total_biznesgo,
        COUNT(*) FILTER (WHERE source = 'agroz_auth_bot')::int AS total_agroz_auth
      FROM unified_archive
    `;

    const [listRes, countRes, statsRes] = await Promise.all([
      query(listSql, [...params, limit, offset]),
      query(countSql, params),
      query(statsSql),
    ]);

    res.json({
      ok: true,
      items: listRes.rows,
      total: countRes.rows[0]?.total || 0,
      stats: statsRes.rows[0] || {
        total_all: 0,
        total_archived: 0,
        total_merchants: 0,
        total_specialists: 0,
        total_users: 0,
        total_biznesgo: 0,
        total_agroz_auth: 0,
      },
      limit,
      offset,
    });
  })
);

/**
 * PATCH /api/super-adm/archive/merchants/:id/archive
 * Soft-delete (Arxivlash)
 */
router.patch(
  '/merchants/:id/archive',
  asyncHandler(async (req, res) => {
    const id = v.int(req.params.id, 'id', { required: true, min: 1 });

    const updateSql = `
      UPDATE merchants
         SET is_archived = true,
             is_active = false,
             archived_at = (now() AT TIME ZONE 'Asia/Tashkent'),
             updated_at = (now() AT TIME ZONE 'Asia/Tashkent')
       WHERE id = $1
   RETURNING id, store_name, phone, business_type, is_active, is_archived, archived_at, updated_at
    `;

    const { rows } = await query(updateSql, [id]);
    if (!rows[0]) throw new HttpError(404, "Do'kon topilmadi", 'MERCHANT_NOT_FOUND');

    res.json({
      ok: true,
      message: `Do'kon ("${rows[0].store_name}") muvaffaqiyatli arxivlandi (Soft-delete)`,
      merchant: rows[0],
    });
  })
);

/**
 * PATCH /api/super-adm/archive/merchants/:id/restore
 * Arxivdan qayta tiklash
 */
router.patch(
  '/merchants/:id/restore',
  asyncHandler(async (req, res) => {
    const id = v.int(req.params.id, 'id', { required: true, min: 1 });

    const updateSql = `
      UPDATE merchants
         SET is_archived = false,
             is_active = true,
             archived_at = NULL,
             updated_at = (now() AT TIME ZONE 'Asia/Tashkent')
       WHERE id = $1
   RETURNING id, store_name, phone, business_type, is_active, is_archived, archived_at, updated_at
    `;

    const { rows } = await query(updateSql, [id]);
    if (!rows[0]) throw new HttpError(404, "Do'kon topilmadi", 'MERCHANT_NOT_FOUND');

    res.json({
      ok: true,
      message: `Do'kon ("${rows[0].store_name}") arxivdan qayta tiklandi va faollashtirildi`,
      merchant: rows[0],
    });
  })
);

module.exports = router;

