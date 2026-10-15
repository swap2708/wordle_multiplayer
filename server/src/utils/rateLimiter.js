/**
 * Creates an in-memory rate limiter.
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} maxRequests - Maximum requests allowed in the time window
 * @returns {(socketId: string) => boolean} - returns true if allowed, false if rate-limited
 */
export function createRateLimiter(windowMs, maxRequests) {
  const requests = new Map();

  return function check(socketId) {
    if (!socketId) return true;
    const now = Date.now();
    const timestamps = requests.get(socketId) || [];

    // Filter out timestamps outside the sliding window
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

    if (validTimestamps.length >= maxRequests) {
      requests.set(socketId, validTimestamps);
      return false;
    }

    validTimestamps.push(now);
    requests.set(socketId, validTimestamps);
    return true;
  };
}
