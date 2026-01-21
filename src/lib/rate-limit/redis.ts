/**
 * Redis-based Rate Limiter
 * Uses Upstash Redis for distributed rate limiting
 * Falls back to in-memory if Redis is not configured or not installed
 */

import { isRedisConfigured } from './config';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory store for fallback
const memoryStore = new Map<string, { count: number; resetAt: number }>();

// Cleanup interval for memory store
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanupTimer(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    memoryStore.forEach((value, key) => {
      if (value.resetAt <= now) {
        memoryStore.delete(key);
      }
    });
  }, 60000); // Cleanup every minute
}

// Track if Redis is available
let redisAvailable: boolean | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisClient: any = null;

/**
 * Get or create Redis client
 * Uses dynamic require to avoid webpack bundling @upstash/redis
 */
async function getRedisClient(): Promise<{
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<unknown>;
  keys: (pattern: string) => Promise<string[]>;
  del: (...keys: string[]) => Promise<unknown>;
} | null> {
  if (redisClient) return redisClient;
  if (redisAvailable === false) return null;

  try {
    // Use eval to prevent webpack from analyzing this import
    // This is safe because we control the module name
    const moduleName = '@upstash/redis';
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const importFn = new Function('moduleName', 'return import(moduleName)');
    const { Redis } = await importFn(moduleName);

    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    redisAvailable = true;
    return redisClient;
  } catch (error) {
    // Only log warning on first failure (when redisAvailable is still null)
    if (redisAvailable === null) {
      console.warn(
        'Redis rate limiting unavailable, using in-memory:',
        error instanceof Error ? error.message : 'Module not found'
      );
    }
    redisAvailable = false;
    return null;
  }
}

/**
 * Check rate limit using Redis (sliding window)
 */
async function checkRateLimitRedis(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redis = await getRedisClient();

  if (!redis) {
    return checkRateLimitMemory(key, limit, windowSeconds);
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowSeconds)}`;

    const current = await redis.incr(windowKey);

    if (current === 1) {
      await redis.expire(windowKey, windowSeconds);
    }

    const remaining = Math.max(0, limit - current);
    const reset = (Math.floor(now / windowSeconds) + 1) * windowSeconds;

    return {
      success: current <= limit,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    return checkRateLimitMemory(key, limit, windowSeconds);
  }
}

/**
 * Check rate limit using in-memory store (fixed window)
 */
function checkRateLimitMemory(key: string, limit: number, windowSeconds: number): RateLimitResult {
  startCleanupTimer();

  const now = Math.floor(Date.now() / 1000);
  const windowKey = `${key}:${Math.floor(now / windowSeconds)}`;

  const entry = memoryStore.get(windowKey);
  const reset = (Math.floor(now / windowSeconds) + 1) * windowSeconds;

  if (!entry) {
    memoryStore.set(windowKey, { count: 1, resetAt: reset });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset,
    };
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);

  return {
    success: entry.count <= limit,
    limit,
    remaining,
    reset,
  };
}

/**
 * Check rate limit - uses Redis if available, falls back to memory
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (isRedisConfigured()) {
    return checkRateLimitRedis(key, limit, windowSeconds);
  }
  return checkRateLimitMemory(key, limit, windowSeconds);
}

/**
 * Reset rate limit for a key (for testing)
 */
export async function resetRateLimit(key: string): Promise<void> {
  // Clear from memory
  Array.from(memoryStore.keys()).forEach((k) => {
    if (k.startsWith(key)) {
      memoryStore.delete(k);
    }
  });

  // Clear from Redis if configured
  if (isRedisConfigured()) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        // Note: This is a basic implementation
        // In production, use SCAN for pattern deletion
        const keys = await redis.keys(`ratelimit:${key}:*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch (error) {
      console.error('Redis reset error:', error);
    }
  }
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  memoryStore.clear();
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (!result.success) {
    const retryAfter = result.reset - Math.floor(Date.now() / 1000);
    headers['Retry-After'] = Math.max(1, retryAfter).toString();
  }

  return headers;
}
