const tracker = new Map();

/**
 * Basic in-memory sliding window rate limiter
 * @param {Request} request 
 * @param {number} limit Max requests allowed in window
 * @param {number} windowMs Time window in milliseconds
 * @returns {boolean} True if under limit, false if rate limited
 */
export function checkRateLimit(request, limit = 30, windowMs = 60 * 1000) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const now = Date.now();
  const record = tracker.get(ip);

  if (!record || now > record.expiresAt) {
    tracker.set(ip, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}
