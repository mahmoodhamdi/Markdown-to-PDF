/**
 * Rate Limit Middleware Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  getIpAddress,
  createRateLimitResponse,
  addRateLimitHeaders,
} from '@/lib/rate-limit/middleware';
import { clearAllRateLimits, getRateLimitHeaders } from '@/lib/rate-limit/redis';

// Helper to create mock NextRequest
function createMockRequest(options: {
  ip?: string;
  forwardedFor?: string;
  realIp?: string;
} = {}): NextRequest {
  const headers = new Headers();
  if (options.forwardedFor) {
    headers.set('x-forwarded-for', options.forwardedFor);
  }
  if (options.realIp) {
    headers.set('x-real-ip', options.realIp);
  }

  return {
    headers,
    ip: options.ip,
  } as unknown as NextRequest;
}

describe('Rate Limit Middleware', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  describe('getIpAddress', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = createMockRequest({
        forwardedFor: '192.168.1.1, 10.0.0.1',
      });

      expect(getIpAddress(request)).toBe('192.168.1.1');
    });

    it('should handle single IP in x-forwarded-for', () => {
      const request = createMockRequest({
        forwardedFor: '192.168.1.100',
      });

      expect(getIpAddress(request)).toBe('192.168.1.100');
    });

    it('should fall back to x-real-ip', () => {
      const request = createMockRequest({
        realIp: '10.0.0.50',
      });

      expect(getIpAddress(request)).toBe('10.0.0.50');
    });

    it('should return unknown when no IP available', () => {
      const request = createMockRequest();

      expect(getIpAddress(request)).toBe('unknown');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const request = createMockRequest({
        forwardedFor: '192.168.1.1',
        realIp: '10.0.0.1',
      });

      expect(getIpAddress(request)).toBe('192.168.1.1');
    });

    it('should trim whitespace from IP', () => {
      const request = createMockRequest({
        forwardedFor: '  192.168.1.1  , 10.0.0.1',
      });

      expect(getIpAddress(request)).toBe('192.168.1.1');
    });
  });

  describe('createRateLimitResponse', () => {
    it('should create 429 response with rate limit info', () => {
      const result = {
        success: false,
        limit: 60,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 30,
      };

      const response = createRateLimitResponse(result);

      expect(response.status).toBe(429);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('Retry-After')).toBeDefined();
    });

    it('should use custom message when provided', async () => {
      const result = {
        success: false,
        limit: 5,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 30,
      };

      const response = createRateLimitResponse(result, 'Custom rate limit message');
      const body = await response.json();

      expect(body.error).toBe('Custom rate limit message');
    });

    it('should include retryAfter in body', async () => {
      const reset = Math.floor(Date.now() / 1000) + 60;
      const result = {
        success: false,
        limit: 5,
        remaining: 0,
        reset,
      };

      const response = createRateLimitResponse(result);
      const body = await response.json();

      expect(body.retryAfter).toBeGreaterThan(0);
      expect(body.retryAfter).toBeLessThanOrEqual(60);
    });
  });

  describe('addRateLimitHeaders', () => {
    it('should add rate limit headers to response', () => {
      const result = {
        success: true,
        limit: 60,
        remaining: 59,
        reset: Math.floor(Date.now() / 1000) + 30,
      };

      const response = NextResponse.json({ data: 'test' });
      const updated = addRateLimitHeaders(response, result);

      expect(updated.headers.get('X-RateLimit-Limit')).toBe('60');
      expect(updated.headers.get('X-RateLimit-Remaining')).toBe('59');
      expect(updated.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should preserve existing response headers', () => {
      const result = {
        success: true,
        limit: 60,
        remaining: 59,
        reset: Math.floor(Date.now() / 1000) + 30,
      };

      const response = NextResponse.json({ data: 'test' }, {
        headers: { 'X-Custom-Header': 'value' },
      });
      const updated = addRateLimitHeaders(response, result);

      expect(updated.headers.get('X-Custom-Header')).toBe('value');
      expect(updated.headers.get('X-RateLimit-Limit')).toBe('60');
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return correct headers for successful request', () => {
      const result = {
        success: true,
        limit: 60,
        remaining: 59,
        reset: Math.floor(Date.now() / 1000) + 30,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('60');
      expect(headers['X-RateLimit-Remaining']).toBe('59');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should include Retry-After header when limit exceeded', () => {
      const result = {
        success: false,
        limit: 5,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 30,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers['Retry-After']).toBeDefined();
      expect(parseInt(headers['Retry-After'])).toBeGreaterThanOrEqual(1);
    });

    it('should have minimum Retry-After of 1 second', () => {
      const result = {
        success: false,
        limit: 5,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) - 10, // 10 seconds in the past
      };

      const headers = getRateLimitHeaders(result);
      expect(headers['Retry-After']).toBe('1');
    });
  });
});
