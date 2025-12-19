/**
 * Integration tests for Unified Checkout API
 * Tests the multi-gateway checkout endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth config
vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

// Mock next-auth
const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

// Mock gateway functions
const mockSelectGateway = vi.fn();
const mockGetGateway = vi.fn();
const mockIsGatewayConfigured = vi.fn();

vi.mock('@/lib/payments', () => ({
  selectGateway: (...args: unknown[]) => mockSelectGateway(...args),
  getGateway: (...args: unknown[]) => mockGetGateway(...args),
  isGatewayConfigured: (...args: unknown[]) => mockIsGatewayConfigured(...args),
}));

import { POST, GET } from '@/app/api/checkout/route';

describe('/api/checkout', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXTAUTH_URL = 'https://example.com';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /api/checkout', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('You must be logged in to subscribe.');
    });

    it('should return 401 when session has no email', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', name: 'Test User' },
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('You must be logged in to subscribe.');
    });

    it('should return 400 for invalid plan', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'invalid', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid request');
    });

    it('should return 400 for invalid billing period', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'invalid' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid request');
    });

    it('should return 400 for invalid country code length', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly', countryCode: 'USA' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid request');
    });

    it('should return 400 for invalid currency length', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly', currency: 'US' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid request');
    });

    it('should return 503 when specified gateway is not configured', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      mockIsGatewayConfigured.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly', gateway: 'paymob' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe("Payment gateway 'paymob' is not configured.");
      expect(mockIsGatewayConfigured).toHaveBeenCalledWith('paymob');
    });

    it('should return 503 when no gateway is available', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      mockSelectGateway.mockImplementation(() => {
        throw new Error('No payment gateway is configured');
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('No payment gateway is available. Please contact support.');
    });

    it('should create checkout session with auto-selected gateway', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      const mockGateway = {
        name: 'stripe',
        createCheckoutSession: vi.fn().mockResolvedValue({
          url: 'https://checkout.stripe.com/session123',
          sessionId: 'cs_test_123',
          gateway: 'stripe',
          clientSecret: 'secret_123',
        }),
      };

      mockSelectGateway.mockReturnValue(mockGateway);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe('https://checkout.stripe.com/session123');
      expect(data.sessionId).toBe('cs_test_123');
      expect(data.gateway).toBe('stripe');
      expect(data.clientSecret).toBe('secret_123');

      expect(mockGateway.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userEmail: 'test@example.com',
          userId: 'user-123',
          userName: 'Test User',
          plan: 'pro',
          billing: 'monthly',
          successUrl: expect.stringContaining('/pricing?success=true'),
          cancelUrl: expect.stringContaining('/pricing?canceled=true'),
        })
      );
    });

    it('should create checkout session with specified gateway', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      mockIsGatewayConfigured.mockReturnValue(true);

      const mockGateway = {
        name: 'paymob',
        createCheckoutSession: vi.fn().mockResolvedValue({
          url: 'https://accept.paymob.com/checkout/456',
          sessionId: 'intention_456',
          gateway: 'paymob',
          clientSecret: 'secret_456',
        }),
      };

      mockGetGateway.mockReturnValue(mockGateway);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly', gateway: 'paymob' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe('https://accept.paymob.com/checkout/456');
      expect(data.gateway).toBe('paymob');
      expect(mockGetGateway).toHaveBeenCalledWith('paymob');
    });

    it('should pass country code and currency to gateway selector', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      const mockGateway = {
        name: 'paytabs',
        createCheckoutSession: vi.fn().mockResolvedValue({
          url: 'https://checkout.paytabs.com/789',
          sessionId: 'order_789',
          gateway: 'paytabs',
        }),
      };

      mockSelectGateway.mockReturnValue(mockGateway);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'team',
          billing: 'yearly',
          countryCode: 'SA',
          currency: 'SAR',
        }),
      });

      await POST(request);

      expect(mockSelectGateway).toHaveBeenCalledWith(
        expect.objectContaining({
          countryCode: 'SA',
          currency: 'SAR',
        })
      );

      expect(mockGateway.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'SAR',
          metadata: expect.objectContaining({
            countryCode: 'SA',
          }),
        })
      );
    });

    it('should handle enterprise plan with quantity', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      const mockGateway = {
        name: 'stripe',
        createCheckoutSession: vi.fn().mockResolvedValue({
          url: 'https://checkout.stripe.com/enterprise',
          sessionId: 'cs_enterprise',
          gateway: 'stripe',
        }),
      };

      mockSelectGateway.mockReturnValue(mockGateway);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'enterprise',
          billing: 'yearly',
          quantity: 50,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockGateway.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: 'enterprise',
          billing: 'yearly',
          quantity: 50,
        })
      );
    });

    it('should return 400 for quantity exceeding max', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          plan: 'enterprise',
          billing: 'yearly',
          quantity: 101,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid request');
    });

    it('should return 503 when price not configured error occurs', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      const mockGateway = {
        name: 'stripe',
        createCheckoutSession: vi.fn().mockRejectedValue(new Error('Price not configured for plan')),
      };

      mockSelectGateway.mockReturnValue(mockGateway);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('This plan is not available yet. Please contact support.');
    });

    it('should return 503 when gateway not configured error occurs', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      const mockGateway = {
        name: 'paddle',
        createCheckoutSession: vi.fn().mockRejectedValue(new Error('Paddle is not configured')),
      };

      mockSelectGateway.mockReturnValue(mockGateway);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Paddle is not configured');
    });

    it('should return 500 for unexpected errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      const mockGateway = {
        name: 'stripe',
        createCheckoutSession: vi.fn().mockRejectedValue(new Error('Unexpected error')),
      };

      mockSelectGateway.mockReturnValue(mockGateway);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create checkout session. Please try again.');
    });

    it('should include locale from accept-language header', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      });

      const mockGateway = {
        name: 'stripe',
        createCheckoutSession: vi.fn().mockResolvedValue({
          url: 'https://checkout.stripe.com/session',
          sessionId: 'cs_test',
          gateway: 'stripe',
        }),
      };

      mockSelectGateway.mockReturnValue(mockGateway);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly' }),
        headers: {
          'accept-language': 'ar-EG,ar;q=0.9,en;q=0.8',
        },
      });

      await POST(request);

      expect(mockGateway.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: 'ar',
        })
      );
    });

    it('should handle missing user name', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });

      const mockGateway = {
        name: 'stripe',
        createCheckoutSession: vi.fn().mockResolvedValue({
          url: 'https://checkout.stripe.com/session',
          sessionId: 'cs_test',
          gateway: 'stripe',
        }),
      };

      mockSelectGateway.mockReturnValue(mockGateway);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: 'pro', billing: 'monthly' }),
      });

      await POST(request);

      expect(mockGateway.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userName: undefined,
        })
      );
    });
  });

  describe('GET /api/checkout', () => {
    it('should return available gateways', async () => {
      mockIsGatewayConfigured.mockImplementation((gateway: string) => {
        return gateway === 'stripe' || gateway === 'paymob';
      });

      const request = new NextRequest('http://localhost:3000/api/checkout');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.gateways).toHaveLength(2);
      expect(data.gateways.map((g: { id: string }) => g.id)).toContain('stripe');
      expect(data.gateways.map((g: { id: string }) => g.id)).toContain('paymob');
      expect(data.recommended).toBe('stripe');
    });

    it('should mark correct gateway as recommended for Egypt', async () => {
      mockIsGatewayConfigured.mockImplementation((gateway: string) => {
        return ['stripe', 'paymob', 'paytabs'].includes(gateway);
      });

      const request = new NextRequest('http://localhost:3000/api/checkout?country=EG');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      const paymobGateway = data.gateways.find((g: { id: string }) => g.id === 'paymob');
      expect(paymobGateway.recommended).toBe(true);
    });

    it('should mark correct gateway as recommended for Saudi Arabia', async () => {
      mockIsGatewayConfigured.mockImplementation((gateway: string) => {
        return ['stripe', 'paymob', 'paytabs'].includes(gateway);
      });

      const request = new NextRequest('http://localhost:3000/api/checkout?country=SA');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      const paytabsGateway = data.gateways.find((g: { id: string }) => g.id === 'paytabs');
      expect(paytabsGateway.recommended).toBe(true);
    });

    it('should return 503 when no gateways are configured', async () => {
      mockIsGatewayConfigured.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/checkout');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('No payment gateways are configured.');
    });

    it('should return first available gateway as fallback recommended', async () => {
      mockIsGatewayConfigured.mockImplementation((gateway: string) => {
        return gateway === 'paddle';
      });

      const request = new NextRequest('http://localhost:3000/api/checkout');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommended).toBe('paddle');
    });

    it('should handle case-insensitive country codes', async () => {
      mockIsGatewayConfigured.mockImplementation((gateway: string) => {
        return ['stripe', 'paymob'].includes(gateway);
      });

      const request = new NextRequest('http://localhost:3000/api/checkout?country=eg');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      const paymobGateway = data.gateways.find((g: { id: string }) => g.id === 'paymob');
      expect(paymobGateway.recommended).toBe(true);
    });

    it('should include all gateway metadata', async () => {
      mockIsGatewayConfigured.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/checkout');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.gateways).toHaveLength(4);

      for (const gateway of data.gateways) {
        expect(gateway).toHaveProperty('id');
        expect(gateway).toHaveProperty('name');
        expect(gateway).toHaveProperty('configured');
        expect(gateway).toHaveProperty('recommended');
      }
    });
  });
});
