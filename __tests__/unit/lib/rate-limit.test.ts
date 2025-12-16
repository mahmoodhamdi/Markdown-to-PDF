import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  getRateLimitHeaders,
  resetRateLimit,
  clearAllRateLimits,
} from '@/lib/rate-limit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const result = checkRateLimit('test-ip', 5, 60000);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
    });

    it('should decrement remaining on each request', () => {
      const result1 = checkRateLimit('test-ip', 5, 60000);
      const result2 = checkRateLimit('test-ip', 5, 60000);
      const result3 = checkRateLimit('test-ip', 5, 60000);

      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(3);
      expect(result3.remaining).toBe(2);
    });

    it('should reject requests when limit exceeded', () => {
      // Make 5 requests to hit the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit('test-ip', 5, 60000);
      }

      // 6th request should be rejected
      const result = checkRateLimit('test-ip', 5, 60000);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should track different identifiers separately', () => {
      // Exhaust limit for ip1
      for (let i = 0; i < 5; i++) {
        checkRateLimit('ip1', 5, 60000);
      }

      // ip1 should be limited
      const ip1Result = checkRateLimit('ip1', 5, 60000);
      expect(ip1Result.success).toBe(false);

      // ip2 should still be allowed
      const ip2Result = checkRateLimit('ip2', 5, 60000);
      expect(ip2Result.success).toBe(true);
    });

    it('should use default values when not specified', () => {
      const result = checkRateLimit('test-ip');
      expect(result.limit).toBe(60);
      expect(result.success).toBe(true);
    });

    it('should include reset timestamp', () => {
      const result = checkRateLimit('test-ip', 5, 60000);
      expect(result.reset).toBeGreaterThan(0);
      expect(typeof result.reset).toBe('number');
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return correct headers', () => {
      const result = {
        success: true,
        limit: 60,
        remaining: 55,
        reset: 1702700000,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('60');
      expect(headers['X-RateLimit-Remaining']).toBe('55');
      expect(headers['X-RateLimit-Reset']).toBe('1702700000');
    });

    it('should handle zero remaining', () => {
      const result = {
        success: false,
        limit: 60,
        remaining: 0,
        reset: 1702700000,
      };

      const headers = getRateLimitHeaders(result);
      expect(headers['X-RateLimit-Remaining']).toBe('0');
    });
  });

  describe('resetRateLimit', () => {
    it('should reset limit for specific identifier', () => {
      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit('test-ip', 5, 60000);
      }

      // Should be limited
      expect(checkRateLimit('test-ip', 5, 60000).success).toBe(false);

      // Reset
      resetRateLimit('test-ip');

      // Should be allowed again
      expect(checkRateLimit('test-ip', 5, 60000).success).toBe(true);
    });

    it('should not affect other identifiers', () => {
      checkRateLimit('ip1', 5, 60000);
      checkRateLimit('ip2', 5, 60000);

      resetRateLimit('ip1');

      // ip2 should still have its history
      const result = checkRateLimit('ip2', 5, 60000);
      expect(result.remaining).toBe(3); // Started at 4, now 3 after second request
    });
  });

  describe('clearAllRateLimits', () => {
    it('should clear all rate limits', () => {
      // Add limits for multiple IPs
      for (let i = 0; i < 5; i++) {
        checkRateLimit('ip1', 5, 60000);
        checkRateLimit('ip2', 5, 60000);
      }

      // Both should be limited
      expect(checkRateLimit('ip1', 5, 60000).success).toBe(false);
      expect(checkRateLimit('ip2', 5, 60000).success).toBe(false);

      // Clear all
      clearAllRateLimits();

      // Both should be allowed
      expect(checkRateLimit('ip1', 5, 60000).success).toBe(true);
      expect(checkRateLimit('ip2', 5, 60000).success).toBe(true);
    });
  });

  describe('sliding window behavior', () => {
    it('should allow requests after window expires', async () => {
      // Use a very short window for testing
      const shortWindow = 100; // 100ms

      // Exhaust limit
      for (let i = 0; i < 3; i++) {
        checkRateLimit('test-ip', 3, shortWindow);
      }

      // Should be limited
      expect(checkRateLimit('test-ip', 3, shortWindow).success).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      expect(checkRateLimit('test-ip', 3, shortWindow).success).toBe(true);
    });
  });
});
