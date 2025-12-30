/**
 * Rate Limiting Module
 *
 * This module provides rate limiting with both synchronous (in-memory) and
 * asynchronous (Redis-backed) implementations.
 *
 * Features:
 * - Synchronous in-memory rate limiting (default, used by existing routes)
 * - Async Redis support (via Upstash) for distributed rate limiting
 * - Per-endpoint configuration
 * - Middleware helpers for easy integration
 *
 * For new routes requiring distributed rate limiting, use:
 * - checkRateLimitAsync() with Redis
 * - withRateLimit() middleware wrapper
 */

// Re-export async functions with explicit names
export {
  checkRateLimit as checkRateLimitAsync,
  resetRateLimit as resetRateLimitAsync,
  clearAllRateLimits as clearAllRateLimitsAsync,
  getRateLimitHeaders as getRateLimitHeadersAsync,
  type RateLimitResult,
} from './rate-limit/redis';

export {
  RATE_LIMITS,
  getRateLimitConfig,
  isRedisConfigured,
  type RateLimitConfig,
} from './rate-limit/config';

export {
  withRateLimit,
  applyRateLimit,
  checkEndpointRateLimit,
  createRateLimitResponse,
  getIpAddress,
} from './rate-limit/middleware';

/**
 * Synchronous rate limiter - in-memory sliding window
 * This is the default used by existing routes for backward compatibility
 */

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanup(windowMs: number): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  const cutoff = now - windowMs;

  rateLimitStore.forEach((entry, key) => {
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  });
}

export interface SyncRateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Synchronous rate limit check (in-memory)
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param limit - Maximum number of requests allowed in window
 * @param windowMs - Time window in milliseconds
 * @returns RateLimitResult with success status and headers info
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60 * 1000
): SyncRateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  // Run cleanup periodically
  cleanup(windowMs);

  // Get or create entry for this identifier
  let entry = rateLimitStore.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(identifier, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

  // Calculate remaining requests
  const remaining = Math.max(0, limit - entry.timestamps.length);
  const reset = Math.ceil((cutoff + windowMs) / 1000);

  // Check if limit exceeded
  if (entry.timestamps.length >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
    };
  }

  // Add current timestamp
  entry.timestamps.push(now);

  return {
    success: true,
    limit,
    remaining: remaining - 1,
    reset,
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: SyncRateLimitResult): Record<string, string> {
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

/**
 * Reset rate limit for an identifier (useful for testing)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Clear all rate limit entries (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
