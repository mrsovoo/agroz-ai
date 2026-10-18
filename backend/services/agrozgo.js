/**
 * AgrozGO ga holat o'zgarishlarini yuborish (ixtiyoriy).
 * AGROZGO_WEBHOOK_URL o'rnatilgan bo'lsa, POST JSON yuboriladi va
 * X-BiznesGO-Signature: hex(HMAC_SHA256(BIZNESGO_BRIDGE_KEY, body)) sarlavhasi qo'shiladi.
 * Xato bo'lsa faqat log yoziladi — asosiy so'rovni to'xtatmaydi.
 */
const crypto = require('crypto');
const config = require('../config');

const WEBHOOK_URL = process.env.AGROZGO_WEBHOOK_URL || '';

function notifyAgrozgo(event, data) {
  if (!WEBHOOK_URL) return;
  const body = JSON.stringify({ event, data, sent_at: new Date().toISOString() });
  const signature = crypto.createHmac('sha256', config.bridgeKey || '').update(body).digest('hex');
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-BiznesGO-Signature': signature },
    body,
    signal: ctrl.signal,
  })
    .then((r) => {
      if (!r.ok) console.warn(`[agrozgo] webhook ${event} → HTTP ${r.status}`);
    })
    .catch((e) => console.warn(`[agrozgo] webhook ${event} xato:`, e.message))
    .finally(() => clearTimeout(t));
}

module.exports = { notifyAgrozgo };

