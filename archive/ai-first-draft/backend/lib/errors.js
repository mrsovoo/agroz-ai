/** HTTP xatolari — route'larda `throw new HttpError(404, '...')`. */
class HttpError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status;
    this.code = code || defaultCode(status);
    if (details !== undefined) this.details = details;
  }
}

function defaultCode(status) {
  return (
    {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
    }[status] || 'ERROR'
  );
}

/** async route handler'larni Express xato zanjiriga ulaydi. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Markaziy xato handler. */
function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, code: err.code, details: err.details });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: "JSON noto'g'ri", code: 'BAD_JSON' });
  }
  // Postgres xatolarini tushunarli javobga aylantirish
  if (err && err.code === '23505') {
    return res.status(409).json({ error: 'Bunday yozuv allaqachon mavjud', code: 'DUPLICATE' });
  }
  if (err && (err.code === '23514' || err.code === '22P02' || err.code === '22003')) {
    return res.status(422).json({ error: "Ma'lumot cheklovlarga mos emas", code: 'CONSTRAINT' });
  }
  console.error('[error]', req.method, req.originalUrl, err);
  return res.status(500).json({ error: 'Ichki server xatosi', code: 'INTERNAL' });
}

module.exports = { HttpError, asyncHandler, errorHandler };

