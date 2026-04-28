// Fix #14: simple in-memory rate limiter (works for next start; use Redis for multi-instance deployments)
const map = new Map();

export function rateLimit(ip, maxRequests = 30, windowMs = 60_000) {
  const now = Date.now();
  const entry = map.get(ip) ?? { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count++;
  map.set(ip, entry);
  return entry.count <= maxRequests;
}
