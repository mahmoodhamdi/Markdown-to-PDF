/**
 * Rate Limit Configuration
 * Centralized configuration for all rate limits
 */

export interface RateLimitConfig {
  /** Maximum requests allowed in window */
  limit: number;
  /** Time window in seconds */
  window: number;
  /** Optional message when limit exceeded */
  message?: string;
}

/**
 * Rate limits for all endpoints
 * Key format: 'category:action'
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Conversion endpoints
  convert: { limit: 60, window: 60, message: 'Conversion rate limit exceeded' },
  'convert:batch': { limit: 10, window: 60, message: 'Batch conversion rate limit exceeded' },
  preview: { limit: 120, window: 60, message: 'Preview rate limit exceeded' },

  // Auth endpoints (stricter)
  'auth:login': { limit: 5, window: 900, message: 'Too many login attempts' }, // 5 per 15 min
  'auth:register': { limit: 5, window: 3600, message: 'Too many registration attempts' }, // 5 per hour
  'auth:forgot-password': { limit: 3, window: 3600, message: 'Too many password reset requests' }, // 3 per hour
  'auth:reset-password': { limit: 10, window: 3600, message: 'Too many password reset attempts' }, // 10 per hour
  'auth:change-email': { limit: 3, window: 3600, message: 'Too many email change requests' }, // 3 per hour

  // Storage endpoints
  'storage:upload': { limit: 30, window: 60, message: 'Upload rate limit exceeded' },
  'storage:download': { limit: 100, window: 60, message: 'Download rate limit exceeded' },
  'storage:delete': { limit: 30, window: 60, message: 'Delete rate limit exceeded' },

  // Team endpoints
  'teams:create': { limit: 5, window: 60, message: 'Team creation rate limit exceeded' },
  'teams:invite': { limit: 20, window: 60, message: 'Invitation rate limit exceeded' },
  'teams:update': { limit: 30, window: 60, message: 'Team update rate limit exceeded' },

  // Profile endpoints
  'profile:update': { limit: 10, window: 60, message: 'Profile update rate limit exceeded' },
  'profile:delete': { limit: 1, window: 3600, message: 'Account deletion rate limited' }, // 1 per hour

  // Analytics endpoints
  'analytics:track': { limit: 100, window: 60, message: 'Analytics rate limit exceeded' },
  'analytics:query': { limit: 30, window: 60, message: 'Analytics query rate limit exceeded' },

  // Subscription endpoints
  'subscription:update': { limit: 10, window: 60, message: 'Subscription update rate limited' },
  'subscription:checkout': { limit: 5, window: 60, message: 'Checkout rate limit exceeded' },

  // Webhook endpoints (higher limits for payment providers)
  'webhook:stripe': { limit: 1000, window: 60 },
  'webhook:paddle': { limit: 1000, window: 60 },
  'webhook:paymob': { limit: 1000, window: 60 },
  'webhook:paytabs': { limit: 1000, window: 60 },

  // SSO endpoints
  'sso:saml': { limit: 30, window: 60, message: 'SSO rate limit exceeded' },
  'sso:oidc': { limit: 30, window: 60, message: 'SSO rate limit exceeded' },

  // Default fallback
  default: { limit: 60, window: 60, message: 'Rate limit exceeded' },
};

/**
 * Get rate limit config for an endpoint
 * Falls back to 'default' if not found
 */
export function getRateLimitConfig(endpoint: string): RateLimitConfig {
  return RATE_LIMITS[endpoint] || RATE_LIMITS['default'];
}

/**
 * Check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
