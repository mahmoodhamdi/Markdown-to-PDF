/**
 * Redis Rate Limiter Tests
 * Tests the in-memory fallback since Redis won't be available in test environment
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  getRateLimitHeaders,
  type RateLimitResult,
} from '@/lib/rate-limit/redis';

describe('Redis Rate Limiter (In-Memory Fallback)', () => {
  beforeEach(() => {
    // Clear all rate limits before each test
    clearAllRateLimits();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const result = await checkRateLimit('test-key', 5, 60);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
      expect(result.reset).toBeGreaterThan(0);
    });

    it('should decrement remaining count with each request', async () => {
      const results: RateLimitResult[] = [];

      for (let i = 0; i < 3; i++) {
        results.push(await checkRateLimit('decrement-test', 5, 60));
      }

      expect(results[0].remaining).toBe(4);
      expect(results[1].remaining).toBe(3);
      expect(results[2].remaining).toBe(2);
    });

    it('should block requests when limit is exceeded', async () => {
      const key = 'exceed-test';

      // Make 5 requests (at the limit)
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(key, 5, 60);
      }

      // 6th request should be blocked
      const result = await checkRateLimit(key, 5, 60);

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should use different windows for different keys', async () => {
      const result1 = await checkRateLimit('key-1', 5, 60);
      const result2 = await checkRateLimit('key-2', 5, 60);

      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(4);
    });

    it('should handle custom limits', async () => {
      const result = await checkRateLimit('custom-limit', 100, 60);

      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(99);
    });

    it('should handle custom window sizes', async () => {
      const result = await checkRateLimit('custom-window', 5, 3600);

      expect(result.success).toBe(true);
      // Reset should be within the hour window
      expect(result.reset).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should return reset timestamp in seconds', async () => {
      const now = Math.floor(Date.now() / 1000);
      const result = await checkRateLimit('reset-test', 5, 60);

      // Reset should be in the future but within window
      expect(result.reset).toBeGreaterThan(now);
      expect(result.reset).toBeLessThanOrEqual(now + 60);
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for a specific key', async () => {
      const key = 'reset-key';

      // Use up some of the limit
      await checkRateLimit(key, 5, 60);
      await checkRateLimit(key, 5, 60);
      await checkRateLimit(key, 5, 60);

      // Reset
      await resetRateLimit(key);

      // Should have full limit again
      const result = await checkRateLimit(key, 5, 60);
      expect(result.remaining).toBe(4);
    });

    it('should only reset matching key prefix', async () => {
      await checkRateLimit('prefix:key1', 5, 60);
      await checkRateLimit('prefix:key2', 5, 60);
      await checkRateLimit('other:key1', 5, 60);

      // Reset keys starting with 'prefix'
      await resetRateLimit('prefix');

      // prefix keys should be reset
      const result1 = await checkRateLimit('prefix:key1', 5, 60);
      expect(result1.remaining).toBe(4);

      // other key should still have used count
      const result2 = await checkRateLimit('other:key1', 5, 60);
      expect(result2.remaining).toBe(3);
    });
  });

  describe('clearAllRateLimits', () => {
    it('should clear all rate limit entries', async () => {
      // Create multiple entries
      await checkRateLimit('clear-test-1', 5, 60);
      await checkRateLimit('clear-test-2', 5, 60);
      await checkRateLimit('clear-test-3', 5, 60);

      // Clear all
      clearAllRateLimits();

      // All should be reset
      const result1 = await checkRateLimit('clear-test-1', 5, 60);
      const result2 = await checkRateLimit('clear-test-2', 5, 60);

      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(4);
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return correct headers for successful request', async () => {
      const result = await checkRateLimit('headers-test', 60, 60);
      const headers = getRateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('60');
      expect(headers['X-RateLimit-Remaining']).toBe('59');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
      expect(headers['Retry-After']).toBeUndefined();
    });

    it('should include Retry-After header when limit exceeded', async () => {
      const key = 'retry-after-test';

      // Exceed the limit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(key, 5, 60);
      }

      const result = await checkRateLimit(key, 5, 60);
      const headers = getRateLimitHeaders(result);

      expect(result.success).toBe(false);
      expect(headers['Retry-After']).toBeDefined();
      expect(parseInt(headers['Retry-After'])).toBeGreaterThanOrEqual(1);
    });

    it('should have minimum Retry-After of 1 second', async () => {
      const result: RateLimitResult = {
        success: false,
        limit: 5,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) - 10, // 10 seconds in the past
      };

      const headers = getRateLimitHeaders(result);
      expect(headers['Retry-After']).toBe('1');
    });
  });

  describe('concurrent requests', () => {
    it('should handle concurrent requests correctly', async () => {
      const key = 'concurrent-test';
      const limit = 10;

      // Make 10 concurrent requests
      const promises = Array(10)
        .fill(null)
        .map(() => checkRateLimit(key, limit, 60));

      const results = await Promise.all(promises);

      // All should succeed
      expect(results.every((r) => r.success)).toBe(true);

      // 11th request should fail
      const overflow = await checkRateLimit(key, limit, 60);
      expect(overflow.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle limit of 1', async () => {
      const key = 'limit-one';

      const first = await checkRateLimit(key, 1, 60);
      expect(first.success).toBe(true);
      expect(first.remaining).toBe(0);

      const second = await checkRateLimit(key, 1, 60);
      expect(second.success).toBe(false);
    });

    it('should handle very large limits', async () => {
      const result = await checkRateLimit('large-limit', 1000000, 60);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(999999);
    });

    it('should handle special characters in key', async () => {
      const key = 'user:test@example.com:convert';

      const result = await checkRateLimit(key, 5, 60);
      expect(result.success).toBe(true);
    });
  });
});
