/**
 * Simple in-memory rate limiter using sliding window algorithm
 * For production, consider using Redis-based solution
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

  const entries = Array.from(rateLimitStore.entries());
  for (let i = 0; i < entries.length; i++) {
    const [key, entry] = entries[i];
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check if a request is within rate limits
 * @param identifier - Unique identifier (IP address, API key, etc.)
 * @param limit - Maximum number of requests allowed in window
 * @param windowMs - Time window in milliseconds
 * @returns RateLimitResult with success status and headers info
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60 * 1000
): RateLimitResult {
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
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
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
