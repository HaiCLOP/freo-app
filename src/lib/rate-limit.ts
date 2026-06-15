import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Define a fallback in-memory cache for development or if Redis is not configured
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupFallback(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.lastReset > windowMs * 2) {
      rateLimitMap.delete(key);
    }
  }
}

// Initialize Upstash Ratelimit if credentials are provided
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? Redis.fromEnv()
  : null;

// We create a sliding window limiter: 5 requests per 60 seconds
const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      analytics: true,
    })
  : null;

/**
 * Check if a request from the given identifier should be allowed.
 * 
 * @param identifier - A unique key (e.g., IP address or user ID)
 * @param limit - Maximum number of requests allowed in the window (for fallback)
 * @param windowMs - Time window in milliseconds (for fallback)
 * @returns true if the request is allowed, false if rate-limited
 */
export async function rateLimit(
  identifier: string,
  limit = 5,
  windowMs = 60_000
): Promise<{ allowed: boolean; remaining: number; resetInMs: number }> {
  if (ratelimit) {
    try {
      const { success, limit: totalLimit, remaining, reset } = await ratelimit.limit(identifier);
      const now = Date.now();
      const resetInMs = Math.max(0, reset - now);
      return { allowed: success, remaining, resetInMs };
    } catch (error) {
      console.error("Upstash rate limit error, falling back to memory:", error);
      // Fall through to memory fallback if Redis fails
    }
  }

  // --- Fallback Memory Implementation ---
  cleanupFallback(windowMs);
  
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
