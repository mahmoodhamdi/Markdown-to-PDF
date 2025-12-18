import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

import { getServerSession } from 'next-auth';
import { GET } from '@/app/api/templates/route';

describe('GET /api/templates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('unauthenticated user (free plan)', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(null);
    });

    it('should return templates array', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templates).toBeDefined();
      expect(Array.isArray(data.templates)).toBe(true);
    });

    it('should return only free templates by default', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates');
      const response = await GET(request);
      const data = await response.json();

      expect(data.templates.length).toBe(6); // 6 free templates
      data.templates.forEach((template: { premium: boolean }) => {
        expect(template.premium).toBe(false);
      });
    });

    it('should include template content for available templates', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates');
      const response = await GET(request);
      const data = await response.json();

      data.templates.forEach((template: { content?: string }) => {
        expect(template.content).toBeDefined();
      });
    });

    it('should return userPlan as free', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates');
      const response = await GET(request);
      const data = await response.json();

      expect(data.userPlan).toBe('free');
    });

    it('should return template stats', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates');
      const response = await GET(request);
      const data = await response.json();

      expect(data.stats).toBeDefined();
      expect(data.stats.total).toBe(10);
      expect(data.stats.free).toBe(6);
      expect(data.stats.premium).toBe(4);
    });
  });

  describe('authenticated user with pro plan', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          plan: 'pro',
        },
        expires: '',
      });
    });

    it('should return all templates for pro user', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates');
      const response = await GET(request);
      const data = await response.json();

      expect(data.templates.length).toBe(10); // All templates
      expect(data.userPlan).toBe('pro');
    });

    it('should include premium templates', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates');
      const response = await GET(request);
      const data = await response.json();

      const ids = data.templates.map((t: { id: string }) => t.id);
      expect(ids).toContain('thesis');
      expect(ids).toContain('invoice');
      expect(ids).toContain('proposal');
      expect(ids).toContain('documentation');
    });
  });

  describe('authenticated user with team plan', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          plan: 'team',
        },
        expires: '',
      });
    });

    it('should return all templates for team user', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates');
      const response = await GET(request);
      const data = await response.json();

      expect(data.templates.length).toBe(10);
      expect(data.userPlan).toBe('team');
    });
  });

  describe('authenticated user with enterprise plan', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          plan: 'enterprise',
        },
        expires: '',
      });
    });

    it('should return all templates for enterprise user', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates');
      const response = await GET(request);
      const data = await response.json();

      expect(data.templates.length).toBe(10);
      expect(data.userPlan).toBe('enterprise');
    });
  });

  describe('showAll query parameter', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(null);
    });

    it('should return all templates when showAll=true even for free user', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates?showAll=true');
      const response = await GET(request);
      const data = await response.json();

      expect(data.templates.length).toBe(10);
    });

    it('should not include content when showAll=true', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates?showAll=true');
      const response = await GET(request);
      const data = await response.json();

      data.templates.forEach((template: { content?: string }) => {
        expect(template.content).toBeUndefined();
      });
    });

    it('should include premium flag for all templates', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates?showAll=true');
      const response = await GET(request);
      const data = await response.json();

      const premiumTemplates = data.templates.filter((t: { premium: boolean }) => t.premium);
      expect(premiumTemplates.length).toBe(4);
    });
  });

  describe('category filter', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          plan: 'pro',
        },
        expires: '',
      });
    });

    it('should filter by business category', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates?category=business');
      const response = await GET(request);
      const data = await response.json();

      data.templates.forEach((template: { category: string }) => {
        expect(template.category).toBe('business');
      });
    });

    it('should filter by academic category', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates?category=academic');
      const response = await GET(request);
      const data = await response.json();

      expect(data.templates.length).toBeGreaterThan(0);
      data.templates.forEach((template: { category: string }) => {
        expect(template.category).toBe('academic');
      });
    });

    it('should filter by technical category', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates?category=technical');
      const response = await GET(request);
      const data = await response.json();

      expect(data.templates.length).toBeGreaterThan(0);
      data.templates.forEach((template: { category: string }) => {
        expect(template.category).toBe('technical');
      });
    });

    it('should filter by personal category', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates?category=personal');
      const response = await GET(request);
      const data = await response.json();

      expect(data.templates.length).toBeGreaterThan(0);
      data.templates.forEach((template: { category: string }) => {
        expect(template.category).toBe('personal');
      });
    });
  });

  describe('combined filters', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(null);
    });

    it('should apply both category and plan filters for free user', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates?category=business');
      const response = await GET(request);
      const data = await response.json();

      // Should only include free business templates
      data.templates.forEach((template: { category: string; premium: boolean }) => {
        expect(template.category).toBe('business');
        expect(template.premium).toBe(false);
      });
    });

    it('should work with showAll and category together', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates?showAll=true&category=business');
      const response = await GET(request);
      const data = await response.json();

      // Should include all business templates (free and premium)
      data.templates.forEach((template: { category: string }) => {
        expect(template.category).toBe('business');
      });
      // Should have both free and premium business templates
      const hasFree = data.templates.some((t: { premium: boolean }) => !t.premium);
      const hasPremium = data.templates.some((t: { premium: boolean }) => t.premium);
      expect(hasFree).toBe(true);
      expect(hasPremium).toBe(true);
    });
  });

  describe('template structure', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(null);
    });

    it('should have id, name, description, category, and premium for each template', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates');
      const response = await GET(request);
      const data = await response.json();

      data.templates.forEach((template: {
        id: string;
        name: string;
        description: string;
        category: string;
        premium: boolean;
      }) => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.category).toBeDefined();
        expect(typeof template.premium).toBe('boolean');
      });
    });

    it('should include common template types', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates');
      const response = await GET(request);
      const data = await response.json();

      const ids = data.templates.map((t: { id: string }) => t.id);
      // Free templates should include these
      expect(ids).toContain('resume');
      expect(ids).toContain('report');
      expect(ids).toContain('readme');
      expect(ids).toContain('meeting');
    });
  });
});
