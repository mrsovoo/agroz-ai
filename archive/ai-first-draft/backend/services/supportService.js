const { query } = require('../db/pool');
const config = require('../config');

let tableEnsured = false;

async function ensureSupportTable() {
  if (tableEnsured) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id              SERIAL PRIMARY KEY,
        merchant_id     INT REFERENCES merchants(id) ON DELETE SET NULL,
        telegram_id     BIGINT,
        sender_type     VARCHAR(20) NOT NULL DEFAULT 'merchant', -- 'merchant' | 'admin' | 'bot_user'
        sender_name     VARCHAR(160),
        sender_phone    VARCHAR(32),
        business_type   VARCHAR(32),
        message         TEXT NOT NULL,
        source          VARCHAR(20) NOT NULL DEFAULT 'web', -- 'web' | 'telegram_bot'
        is_read         BOOLEAN NOT NULL DEFAULT false,
        reply_to_id     INT REFERENCES support_messages(id) ON DELETE SET NULL,
        created_at      TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tashkent')
      );

      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_messages' AND column_name = 'ticket_id') THEN
          ALTER TABLE support_messages ALTER COLUMN ticket_id DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_messages' AND column_name = 'sender') THEN
          ALTER TABLE support_messages ALTER COLUMN sender DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_messages' AND column_name = 'text') THEN
          ALTER TABLE support_messages ALTER COLUMN text DROP NOT NULL;
        END IF;
      END $$;

      ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS merchant_id INT REFERENCES merchants(id) ON DELETE SET NULL;
      ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS telegram_id BIGINT;
      ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS sender_type VARCHAR(20) NOT NULL DEFAULT 'merchant';
      ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS sender_name VARCHAR(160);
      ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS sender_phone VARCHAR(32);
      ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS business_type VARCHAR(32);
      ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS message TEXT;
      ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'web';
      ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS reply_to_id INT REFERENCES support_messages(id) ON DELETE SET NULL;

      CREATE INDEX IF NOT EXISTS support_msg_merchant_idx ON support_messages (merchant_id);
      CREATE INDEX IF NOT EXISTS support_msg_tg_idx ON support_messages (telegram_id);
      CREATE INDEX IF NOT EXISTS support_msg_created_idx ON support_messages (created_at DESC);
    `);
    tableEnsured = true;
  } catch (err) {
    console.error('[SupportService] Failed to ensure support_messages table:', err.message);
  }
}

// Startup call
ensureSupportTable();

async function addMessage({
  merchantId = null,
  telegramId = null,
  senderType = 'merchant',
  senderName = '',
  senderPhone = '',
  businessType = '',
  message = '',
  source = 'web',
  replyToId = null,
}) {
  await ensureSupportTable();

  // If merchantId is present but some fields are missing, enrich from merchants and users table
  if (merchantId && (!senderName || !senderPhone || !businessType || !telegramId)) {
    try {
      const mRes = await query(
        `SELECT m.store_name, u.name AS owner_name, m.phone, m.business_type, u.telegram_id 
         FROM merchants m 
         LEFT JOIN users u ON u.id = m.user_id 
         WHERE m.id = $1`,
        [merchantId]
      );
      if (mRes.rows[0]) {
        const m = mRes.rows[0];
        if (!senderName) senderName = m.store_name || m.owner_name;
        if (!senderPhone) senderPhone = m.phone;
        if (!businessType) businessType = m.business_type;
        if (!telegramId && m.telegram_id) telegramId = m.telegram_id;
      }
    } catch {}
  }

  const sql = `
    INSERT INTO support_messages (
      merchant_id, telegram_id, sender_type, sender_name, sender_phone,
      business_type, message, source, is_read, reply_to_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9)
    RETURNING *
  `;
  const res = await query(sql, [
    merchantId,
    telegramId,
    senderType,
    senderName,
    senderPhone,
    businessType,
    message.trim(),
    source,
    replyToId,
  ]);
  return res.rows[0];
}

async function getMerchantMessages(merchantId) {
  await ensureSupportTable();
  const res = await query(
    `SELECT * FROM support_messages 
     WHERE merchant_id = $1 
     ORDER BY created_at ASC`,
    [merchantId]
  );
  return res.rows;
}

async function getAllConversations() {
  await ensureSupportTable();

  const sql = `
    WITH latest_messages AS (
      SELECT DISTINCT ON (
        COALESCE('m_' || merchant_id::text, 'tg_' || telegram_id::text, 'id_' || id::text)
      )
        COALESCE('m_' || merchant_id::text, 'tg_' || telegram_id::text, 'id_' || id::text) AS thread_id,
        id,
        merchant_id,
        telegram_id,
        sender_type,
        sender_name,
        sender_phone,
        business_type,
        message AS last_message,
        source,
        created_at AS last_message_at
      FROM support_messages
      ORDER BY 
        COALESCE('m_' || merchant_id::text, 'tg_' || telegram_id::text, 'id_' || id::text),
        created_at DESC, id DESC
    ),
    unread_counts AS (
      SELECT 
        COALESCE('m_' || merchant_id::text, 'tg_' || telegram_id::text, 'id_' || id::text) AS thread_id,
        COUNT(*) AS unread_count
      FROM support_messages
      WHERE is_read = false AND sender_type != 'admin'
      GROUP BY 1
    ),
    message_counts AS (
      SELECT 
        COALESCE('m_' || merchant_id::text, 'tg_' || telegram_id::text, 'id_' || id::text) AS thread_id,
        COUNT(*) AS total_messages
      FROM support_messages
      GROUP BY 1
    )
    SELECT 
      lm.*,
      COALESCE(uc.unread_count, 0)::int AS unread_count,
      COALESCE(mc.total_messages, 1)::int AS total_messages,
      m.store_name,
      u.name AS owner_name,
      COALESCE(m.phone, lm.sender_phone) AS current_phone,
      COALESCE(m.business_type, lm.business_type) AS resolved_business_type
    FROM latest_messages lm
    LEFT JOIN unread_counts uc ON lm.thread_id = uc.thread_id
    LEFT JOIN message_counts mc ON lm.thread_id = mc.thread_id
    LEFT JOIN merchants m ON lm.merchant_id = m.id
    LEFT JOIN users u ON u.id = m.user_id
    ORDER BY lm.last_message_at DESC
  `;

  const res = await query(sql);
  return res.rows;
}

async function getThreadMessages({ merchantId = null, telegramId = null }) {
  await ensureSupportTable();

  let sql = '';
  let params = [];

  if (merchantId) {
    sql = `
      SELECT * FROM support_messages
      WHERE merchant_id = $1
      ORDER BY created_at ASC
    `;
    params = [merchantId];
    // Mark as read
    await query(
      `UPDATE support_messages SET is_read = true WHERE merchant_id = $1 AND sender_type != 'admin'`,
      [merchantId]
    );
  } else if (telegramId) {
    sql = `
      SELECT * FROM support_messages
      WHERE telegram_id = $1
      ORDER BY created_at ASC
    `;
    params = [telegramId];
    // Mark as read
    await query(
      `UPDATE support_messages SET is_read = true WHERE telegram_id = $1 AND sender_type != 'admin'`,
      [telegramId]
    );
  } else {
    return [];
  }

  const res = await query(sql, params);
  return res.rows;
}

async function replyToThread({
  merchantId = null,
  telegramId = null,
  message = '',
  adminName = 'Super Admin',
  replyToId = null,
}) {
  await ensureSupportTable();

  let targetTgId = telegramId;
  let targetBusinessType = '';
  let targetStoreName = '';

  if (merchantId) {
    try {
      const mRes = await query(
        `SELECT m.store_name, m.business_type, u.telegram_id 
         FROM merchants m 
         LEFT JOIN users u ON u.id = m.user_id 
         WHERE m.id = $1`,
        [merchantId]
      );
      if (mRes.rows[0]) {
        targetStoreName = mRes.rows[0].store_name;
        targetBusinessType = mRes.rows[0].business_type;
        if (!targetTgId && mRes.rows[0].telegram_id) {
          targetTgId = mRes.rows[0].telegram_id;
        }
      }
    } catch {}
  }

  const source = targetTgId ? 'telegram_bot' : 'web';

  const insertSql = `
    INSERT INTO support_messages (
      merchant_id, telegram_id, sender_type, sender_name,
      business_type, message, source, is_read, reply_to_id
    )
    VALUES ($1, $2, 'admin', $3, $4, $5, $6, true, $7)
    RETURNING *
  `;

  const res = await query(insertSql, [
    merchantId,
    targetTgId,
    adminName,
    targetBusinessType,
    message.trim(),
    source,
    replyToId,
  ]);

  const createdMsg = res.rows[0];

  // Agar telegram_id mavjud bo'lsa, Telegram bot orqali foydalanuvchiga to'g'ridan-to'g'ri yuboramiz
  let tgSent = false;
  let tgError = null;
  if (targetTgId) {
    try {
      const { callTelegramApi } = require('./telegramBot');
      const text =
        `💬 <b>Qo‘llab-quvvatlash xizmati javobi:</b>\n\n` +
        `${message.trim()}\n\n` +
        `<i>BiznesGO Administratori • ${adminName}</i>\n` +
        `<i>Savol yoki javobingizni shu yerga yozib yuborishingiz mumkin.</i>`;

      const botRes = await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
        chat_id: targetTgId,
        text,
        parse_mode: 'HTML',
      });
      tgSent = Boolean(botRes && botRes.ok);
    } catch (e) {
      tgError = e.message;
      console.warn('[SupportService] Failed to forward reply to Telegram:', e.message);
    }
  }

  return { message: createdMsg, telegram_sent: tgSent, telegram_error: tgError };
}

async function getUnreadStats() {
  await ensureSupportTable();
  try {
    const res = await query(`
      SELECT COUNT(*)::int AS unread_total
      FROM support_messages
      WHERE is_read = false AND sender_type != 'admin'
    `);
    return res.rows[0]?.unread_total || 0;
  } catch {
    return 0;
  }
}

module.exports = {
  ensureSupportTable,
  addMessage,
  getMerchantMessages,
  getAllConversations,
  getThreadMessages,
  replyToThread,
  getUnreadStats,
};
