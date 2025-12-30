/**
 * Rate Limiting Module
 * Unified rate limiting with Redis support and in-memory fallback
 */

// Configuration exports
export {
  RATE_LIMITS,
  getRateLimitConfig,
  isRedisConfigured,
  type RateLimitConfig,
} from './config';

// Core rate limiting exports
export {
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  getRateLimitHeaders,
  type RateLimitResult,
} from './redis';

// Middleware exports
export {
  getIpAddress,
  getRateLimitIdentifier,
  applyRateLimit,
  createRateLimitResponse,
  addRateLimitHeaders,
  withRateLimit,
  checkEndpointRateLimit,
} from './middleware';
