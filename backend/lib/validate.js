/**
 * Yengil validatsiya yordamchilari (tashqi kutubxonasiz).
 * Har bir funksiya noto'g'ri qiymatda HttpError(422) tashlaydi.
 */
const { HttpError } = require('./errors');

const fail = (field, msg) => {
  throw new HttpError(422, msg || `${field} noto'g'ri`, 'VALIDATION_ERROR', { field });
};

function str(value, field, { required = false, max = 255, min = 0 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) fail(field, `${field} majburiy`);
    return null;
  }
  if (typeof value !== 'string' && typeof value !== 'number') fail(field);
  const s = String(value).trim();
  if (required && !s) fail(field, `${field} majburiy`);
  if (s.length < min) fail(field, `${field} kamida ${min} belgi bo'lishi kerak`);
  if (s.length > max) fail(field, `${field} ${max} belgidan oshmasin`);
  return s || null;
}

function num(value, field, { required = false, min = -Infinity, max = Infinity, positive = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) fail(field, `${field} majburiy`);
    return null;
  }
  const n = typeof value === 'number' ? value : Number(String(value).replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n)) fail(field, `${field} son bo'lishi kerak`);
  if (positive && n <= 0) fail(field, `${field} 0 dan katta bo'lishi kerak`);
  if (n < min) fail(field, `${field} ${min} dan kichik bo'lmasin`);
  if (n > max) fail(field, `${field} juda katta`);
  return n;
}

function int(value, field, opts = {}) {
  const n = num(value, field, opts);
  if (n !== null && !Number.isInteger(n)) fail(field, `${field} butun son bo'lishi kerak`);
  return n;
}

function bool(value, field, { defaultValue = null } = {}) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return fail(field);
}

function oneOf(value, field, allowed, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) fail(field, `${field} majburiy`);
    return null;
  }
  if (!allowed.includes(value)) fail(field, `${field} quyidagilardan biri bo'lishi kerak: ${allowed.join(', ')}`);
  return value;
}

function date(value, field, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) fail(field, `${field} majburiy`);
    return null;
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    fail(field, `${field} YYYY-MM-DD formatida bo'lishi kerak`);
  }
  return value;
}

/** O'zbekiston telefon raqamini +998XXXXXXXXX ko'rinishiga keltiradi. */
function phone(value, field = 'phone', { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) fail(field, 'Telefon raqam majburiy');
    return null;
  }
  let digits = String(value).replace(/\D/g, '');
  if (digits.length === 9) digits = `998${digits}`;
  if (!/^998\d{9}$/.test(digits)) fail(field, "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak");
  return `+${digits}`;
}

function idParam(value, field = 'id') {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0 || n > 2147483647) throw new HttpError(400, `${field} noto'g'ri`, 'BAD_ID');
  return n;
}

/** Sahifalash: ?limit=&offset= */
function paging(q, { defLimit = 50, maxLimit = 200 } = {}) {
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || defLimit, 1), maxLimit);
  const offset = Math.max(parseInt(q.offset, 10) || 0, 0);
  return { limit, offset };
}

/** Pul summasini 2 xonagacha yaxlitlash (floating xatolarini kamaytirish). */
const money = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

module.exports = { str, num, int, bool, oneOf, date, phone, idParam, paging, money };

