/**
 * Rate Limit Configuration Tests
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  RATE_LIMITS,
  getRateLimitConfig,
  isRedisConfigured,
} from '@/lib/rate-limit/config';

describe('Rate Limit Config', () => {
  describe('RATE_LIMITS', () => {
    it('should have default configuration', () => {
      expect(RATE_LIMITS.default).toBeDefined();
      expect(RATE_LIMITS.default.limit).toBeGreaterThan(0);
      expect(RATE_LIMITS.default.window).toBeGreaterThan(0);
    });

    it('should have convert endpoint configuration', () => {
      expect(RATE_LIMITS.convert).toBeDefined();
      expect(RATE_LIMITS.convert.limit).toBe(60);
      expect(RATE_LIMITS.convert.window).toBe(60);
    });

    it('should have convert:batch endpoint configuration', () => {
      expect(RATE_LIMITS['convert:batch']).toBeDefined();
      expect(RATE_LIMITS['convert:batch'].limit).toBe(10);
      expect(RATE_LIMITS['convert:batch'].window).toBe(60);
    });

    it('should have preview endpoint configuration', () => {
      expect(RATE_LIMITS.preview).toBeDefined();
      expect(RATE_LIMITS.preview.limit).toBe(120);
      expect(RATE_LIMITS.preview.window).toBe(60);
    });

    it('should have auth login configuration with strict limits', () => {
      expect(RATE_LIMITS['auth:login']).toBeDefined();
      expect(RATE_LIMITS['auth:login'].limit).toBe(5);
      expect(RATE_LIMITS['auth:login'].window).toBe(900); // 15 minutes
    });

    it('should have auth register configuration', () => {
      expect(RATE_LIMITS['auth:register']).toBeDefined();
      expect(RATE_LIMITS['auth:register'].limit).toBe(5);
      expect(RATE_LIMITS['auth:register'].window).toBe(3600); // 1 hour
    });

    it('should have forgot password configuration', () => {
      expect(RATE_LIMITS['auth:forgot-password']).toBeDefined();
      expect(RATE_LIMITS['auth:forgot-password'].limit).toBe(3);
      expect(RATE_LIMITS['auth:forgot-password'].window).toBe(3600);
    });

    it('should have reset password configuration', () => {
      expect(RATE_LIMITS['auth:reset-password']).toBeDefined();
      expect(RATE_LIMITS['auth:reset-password'].limit).toBe(10);
      expect(RATE_LIMITS['auth:reset-password'].window).toBe(3600);
    });

    it('should have storage upload endpoint configuration', () => {
      expect(RATE_LIMITS['storage:upload']).toBeDefined();
      expect(RATE_LIMITS['storage:upload'].limit).toBe(30);
      expect(RATE_LIMITS['storage:upload'].window).toBe(60);
    });

    it('should have storage download endpoint configuration', () => {
      expect(RATE_LIMITS['storage:download']).toBeDefined();
      expect(RATE_LIMITS['storage:download'].limit).toBe(100);
      expect(RATE_LIMITS['storage:download'].window).toBe(60);
    });

    it('should have subscription checkout configuration', () => {
      expect(RATE_LIMITS['subscription:checkout']).toBeDefined();
      expect(RATE_LIMITS['subscription:checkout'].limit).toBe(5);
      expect(RATE_LIMITS['subscription:checkout'].window).toBe(60);
    });

    it('should have teams create configuration', () => {
      expect(RATE_LIMITS['teams:create']).toBeDefined();
      expect(RATE_LIMITS['teams:create'].limit).toBe(5);
      expect(RATE_LIMITS['teams:create'].window).toBe(60);
    });

    it('should have teams invite configuration', () => {
      expect(RATE_LIMITS['teams:invite']).toBeDefined();
      expect(RATE_LIMITS['teams:invite'].limit).toBe(20);
      expect(RATE_LIMITS['teams:invite'].window).toBe(60);
    });

    it('should have webhook configurations with high limits', () => {
      expect(RATE_LIMITS['webhook:stripe']).toBeDefined();
      expect(RATE_LIMITS['webhook:stripe'].limit).toBe(1000);
      expect(RATE_LIMITS['webhook:paddle'].limit).toBe(1000);
      expect(RATE_LIMITS['webhook:paymob'].limit).toBe(1000);
      expect(RATE_LIMITS['webhook:paytabs'].limit).toBe(1000);
    });

    it('should have SSO configurations', () => {
      expect(RATE_LIMITS['sso:saml']).toBeDefined();
      expect(RATE_LIMITS['sso:saml'].limit).toBe(30);
      expect(RATE_LIMITS['sso:oidc'].limit).toBe(30);
    });

    it('should include custom messages for specific endpoints', () => {
      expect(RATE_LIMITS['auth:login'].message).toContain('Too many login attempts');
      expect(RATE_LIMITS['auth:register'].message).toContain('Too many registration attempts');
      expect(RATE_LIMITS.convert.message).toContain('Conversion rate limit exceeded');
    });
  });

  describe('getRateLimitConfig', () => {
    it('should return config for known endpoints', () => {
      const config = getRateLimitConfig('convert');
      expect(config.limit).toBe(60);
      expect(config.window).toBe(60);
    });

    it('should return default config for unknown endpoints', () => {
      const config = getRateLimitConfig('unknown-endpoint');
      expect(config).toEqual(RATE_LIMITS.default);
    });

    it('should return config with custom message', () => {
      const config = getRateLimitConfig('auth:login');
      expect(config.message).toBeDefined();
      expect(config.message).toContain('login');
    });

    it('should handle colon-separated endpoint names', () => {
      const config = getRateLimitConfig('auth:forgot-password');
      expect(config.limit).toBe(3);
    });

    it('should handle nested endpoint names', () => {
      const config = getRateLimitConfig('storage:upload');
      expect(config.limit).toBe(30);
    });
  });

  describe('isRedisConfigured', () => {
    const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    afterEach(() => {
      // Restore original env vars
      if (originalUrl !== undefined) {
        process.env.UPSTASH_REDIS_REST_URL = originalUrl;
      } else {
        delete process.env.UPSTASH_REDIS_REST_URL;
      }
      if (originalToken !== undefined) {
        process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
      } else {
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
      }
    });

    it('should return false when Redis env vars are not set', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      expect(isRedisConfigured()).toBe(false);
    });

    it('should return false when only URL is set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      expect(isRedisConfigured()).toBe(false);
    });

    it('should return false when only token is set', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      process.env.UPSTASH_REDIS_REST_TOKEN = 'some-token';

      expect(isRedisConfigured()).toBe(false);
    });

    it('should return true when both URL and token are set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'some-token';

      expect(isRedisConfigured()).toBe(true);
    });
  });
});
