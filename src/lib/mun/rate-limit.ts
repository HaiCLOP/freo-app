/**
 * Freo MUN — Rate Limiting
 * MUN-specific rate limiters using existing Upstash Redis.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

function createLimiter(maxRequests: number, windowMs: `${number} ms` | `${number} s` | `${number} m` | `${number} h` | `${number} d`) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, windowMs),
    analytics: true,
    prefix: "mun_rl",
  });
}

// ─── Limiter Instances ────────────────────────────────────────────────────

const limiters = {
  registration: createLimiter(5, "60 m"),
  allotment: createLimiter(3, "60 m"),
  paperUpload: createLimiter(10, "1440 m"),
  certGeneration: createLimiter(5, "1440 m"),
  qrValidation: createLimiter(30, "1 m"),
  ebInvite: createLimiter(20, "60 m"),
  crisisUpdate: createLimiter(60, "60 m"),
  apiGeneral: createLimiter(30, "1 m"),
  realtimePoll: createLimiter(10, "10 s"),
} as const;

type LimiterName = keyof typeof limiters;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

export async function checkMunRateLimit(
  limiterName: LimiterName,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = limiters[limiterName];
  if (!limiter) {
    console.error(`[MUN RL] Redis not configured. Blocking '${limiterName}'.`);
    return { allowed: false, remaining: 0, resetInMs: 60_000 };
  }
  try {
    const { success, remaining, reset } = await limiter.limit(`${limiterName}:${identifier}`);
    return { allowed: success, remaining, resetInMs: Math.max(0, reset - Date.now()) };
  } catch (error) {
    console.error(`[MUN RL] Error on '${limiterName}':`, error);
    return { allowed: false, remaining: 0, resetInMs: 60_000 };
  }
}

/** Throws if rate limited. Use in server actions. */
export async function enforceMunRateLimit(
  limiterName: LimiterName,
  identifier: string
): Promise<void> {
  const result = await checkMunRateLimit(limiterName, identifier);
  if (!result.allowed) {
    throw new Error(`Rate limited. Try again in ${Math.ceil(result.resetInMs / 1000)}s.`);
  }
}
