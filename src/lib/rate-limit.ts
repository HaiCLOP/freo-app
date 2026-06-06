/**
 * Simple in-memory rate limiter for serverless functions.
 * 
 * NOTE: This works within a single Vercel serverless instance. For true
 * distributed rate limiting at 10K+ users, switch to Upstash Redis:
 *   npm install @upstash/ratelimit @upstash/redis
 * 
 * This is still valuable as a first line of defense to prevent obvious abuse.
 */

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

// Clean up stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.lastReset > windowMs * 2) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Check if a request from the given identifier should be allowed.
 * 
 * @param identifier - A unique key (e.g., IP address or user ID)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60 seconds)
 * @returns true if the request is allowed, false if rate-limited
 */
export function rateLimit(
  identifier: string,
  limit = 5,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetInMs: number } {
  cleanup(windowMs);
  
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // First request or window expired — reset
  if (!record || now - record.lastReset > windowMs) {
    rateLimitMap.set(identifier, { count: 1, lastReset: now });
    return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
  }

  // Within window — check count
  if (record.count >= limit) {
    const resetInMs = windowMs - (now - record.lastReset);
    return { allowed: false, remaining: 0, resetInMs };
  }

  record.count++;
  const resetInMs = windowMs - (now - record.lastReset);
  return { allowed: true, remaining: limit - record.count, resetInMs };
}
