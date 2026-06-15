import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";


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
  if (!ratelimit) {
    console.error("CRITICAL: Upstash Redis is not configured. Rate limiting is disabled and failing secure.");
    return { allowed: false, remaining: 0, resetInMs: windowMs };
  }

  try {
    const { success, limit: totalLimit, remaining, reset } = await ratelimit.limit(identifier);
    const now = Date.now();
    const resetInMs = Math.max(0, reset - now);
    return { allowed: success, remaining, resetInMs };
  } catch (error) {
    console.error("Upstash rate limit error, failing secure:", error);
    return { allowed: false, remaining: 0, resetInMs: windowMs };
  }
}
