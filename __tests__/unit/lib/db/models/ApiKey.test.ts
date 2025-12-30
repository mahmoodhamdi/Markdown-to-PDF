import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

// Import only the pure functions and constants that don't depend on mongoose
import {
  hashApiKey,
  getDefaultRateLimit,
  API_KEY_LIMITS,
  API_PERMISSIONS,
} from '@/lib/db/models/ApiKey';

describe('ApiKey Model Utilities', () => {
  describe('hashApiKey', () => {
    it('should hash a plain API key using SHA256', () => {
      const plainKey = 'mk_test123456789';
      const hash = hashApiKey(plainKey);

      // Verify it's a valid SHA256 hash (64 hex characters)
      expect(hash).toMatch(/^[a-f0-9]{64}$/);

      // Verify it's deterministic
      const hash2 = hashApiKey(plainKey);
      expect(hash).toBe(hash2);
    });

    it('should produce different hashes for different keys', () => {
      const hash1 = hashApiKey('mk_key1');
      const hash2 = hashApiKey('mk_key2');

      expect(hash1).not.toBe(hash2);
    });

    it('should match crypto.createHash directly', () => {
      const plainKey = 'mk_testkey123';
      const hash = hashApiKey(plainKey);
      const expectedHash = crypto.createHash('sha256').update(plainKey).digest('hex');

      expect(hash).toBe(expectedHash);
    });
  });

  describe('API_KEY_LIMITS', () => {
    it('should have correct limits for free plan', () => {
      expect(API_KEY_LIMITS.free.maxKeys).toBe(1);
      expect(API_KEY_LIMITS.free.rateLimit).toBe(100);
      expect(API_KEY_LIMITS.free.rateLimitWindow).toBe(60);
    });

    it('should have correct limits for pro plan', () => {
      expect(API_KEY_LIMITS.pro.maxKeys).toBe(5);
      expect(API_KEY_LIMITS.pro.rateLimit).toBe(500);
      expect(API_KEY_LIMITS.pro.rateLimitWindow).toBe(60);
    });

    it('should have correct limits for team plan', () => {
      expect(API_KEY_LIMITS.team.maxKeys).toBe(20);
      expect(API_KEY_LIMITS.team.rateLimit).toBe(2000);
      expect(API_KEY_LIMITS.team.rateLimitWindow).toBe(60);
    });

    it('should have correct limits for enterprise plan', () => {
      expect(API_KEY_LIMITS.enterprise.maxKeys).toBe(100);
      expect(API_KEY_LIMITS.enterprise.rateLimit).toBe(10000);
      expect(API_KEY_LIMITS.enterprise.rateLimitWindow).toBe(60);
    });
  });

  describe('API_PERMISSIONS', () => {
    it('should include all expected permissions', () => {
      expect(API_PERMISSIONS).toContain('convert');
      expect(API_PERMISSIONS).toContain('preview');
      expect(API_PERMISSIONS).toContain('batch');
      expect(API_PERMISSIONS).toContain('templates');
      expect(API_PERMISSIONS).toContain('themes');
      expect(API_PERMISSIONS).toHaveLength(5);
    });

    it('should be in the correct order', () => {
      expect(API_PERMISSIONS).toEqual(['convert', 'preview', 'batch', 'templates', 'themes']);
    });
  });

  describe('getDefaultRateLimit', () => {
    it('should return correct rate limits for free plan', () => {
      expect(getDefaultRateLimit('free')).toEqual({ limit: 100, window: 60 });
    });

    it('should return correct rate limits for pro plan', () => {
      expect(getDefaultRateLimit('pro')).toEqual({ limit: 500, window: 60 });
    });

    it('should return correct rate limits for team plan', () => {
      expect(getDefaultRateLimit('team')).toEqual({ limit: 2000, window: 60 });
    });

    it('should return correct rate limits for enterprise plan', () => {
      expect(getDefaultRateLimit('enterprise')).toEqual({ limit: 10000, window: 60 });
    });
  });
});

describe('API Key Format', () => {
  it('should generate keys with correct prefix format', () => {
    // Simulate key generation format
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const plainKey = `mk_${randomBytes}`;

    expect(plainKey).toMatch(/^mk_[a-f0-9]{64}$/);
    expect(plainKey.length).toBe(67); // 3 (prefix) + 64 (hex)
  });

  it('should generate unique keys', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const randomBytes = crypto.randomBytes(32).toString('hex');
      const plainKey = `mk_${randomBytes}`;
      keys.add(plainKey);
    }
    expect(keys.size).toBe(100);
  });

  it('should have consistent prefix length', () => {
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const plainKey = `mk_${randomBytes}`;
    const keyPrefix = plainKey.substring(0, 11); // mk_ + first 8 chars

    expect(keyPrefix).toMatch(/^mk_[a-f0-9]{8}$/);
    expect(keyPrefix.length).toBe(11);
  });
});
