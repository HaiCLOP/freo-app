import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";


// Initialize Upstash Ratelimit if credentials are provided
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? Redis.fromEnv()
  : null;

// We create a sliding window limiter: 5 requests per 60 seconds (General API)
const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      analytics: true,
      prefix: "@upstash/ratelimit:general",
    })
  : null;

// AI Form Builder: 3 requests per day
const aiFormLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 d"),
      analytics: true,
      prefix: "@upstash/ratelimit:ai_form",
    })
  : null;

// AI Analytics: 5 requests per day
const aiAnalyticsLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 d"),
      analytics: true,
      prefix: "@upstash/ratelimit:ai_analytics",
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

export async function checkAiFormLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  if (!aiFormLimiter) {
    console.error("CRITICAL: Upstash Redis is not configured. Failing secure for AI.");
    return { allowed: false, remaining: 0 };
  }
  try {
    const { success, remaining } = await aiFormLimiter.limit(userId);
    return { allowed: success, remaining };
  } catch (error) {
    console.error("Upstash rate limit error, failing secure:", error);
    return { allowed: false, remaining: 0 };
  }
}

export async function checkAiAnalyticsLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  if (!aiAnalyticsLimiter) {
    console.error("CRITICAL: Upstash Redis is not configured. Failing secure for AI.");
    return { allowed: false, remaining: 0 };
  }
  try {
    const { success, remaining } = await aiAnalyticsLimiter.limit(userId);
    return { allowed: success, remaining };
  } catch (error) {
    console.error("Upstash rate limit error, failing secure:", error);
    return { allowed: false, remaining: 0 };
  }
}

