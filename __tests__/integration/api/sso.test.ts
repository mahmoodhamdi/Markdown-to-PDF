/**
 * SSO API Integration Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Firebase Admin
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
      where: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(),
          })),
          get: vi.fn(),
        })),
        limit: vi.fn(() => ({
          get: vi.fn(),
        })),
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(),
            startAfter: vi.fn(() => ({
              get: vi.fn(),
            })),
          })),
        })),
        get: vi.fn(),
      })),
    })),
    batch: vi.fn(() => ({
      delete: vi.fn(),
      commit: vi.fn(),
    })),
  },
  adminAuth: {
    verifyIdToken: vi.fn(),
    getUser: vi.fn(),
  },
}));

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 10, reset: Date.now() + 60000 })),
  getRateLimitHeaders: vi.fn(() => ({})),
}));

import { getServerSession } from 'next-auth';
import { adminDb } from '@/lib/firebase/admin';

describe('/api/sso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/sso/config', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { GET } = await import('@/app/api/sso/config/route');
      const request = new NextRequest('http://localhost:3000/api/sso/config?organizationId=org-123');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 when user is not enterprise', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'user@example.com', plan: 'free' },
      } as any);

      const { GET } = await import('@/app/api/sso/config/route');
      const request = new NextRequest('http://localhost:3000/api/sso/config?organizationId=org-123');
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('should return 400 when organizationId is missing', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@company.com', plan: 'enterprise' },
      } as any);

      const { GET } = await import('@/app/api/sso/config/route');
      const request = new NextRequest('http://localhost:3000/api/sso/config');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should return SSO config for enterprise user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@company.com', plan: 'enterprise' },
      } as any);

      const mockConfig = {
        id: 'sso-123',
        provider: 'saml',
        status: 'active',
      };

      vi.mocked(adminDb.collection).mockImplementation(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({
              empty: false,
              docs: [{ data: () => mockConfig }],
            }),
          })),
        })),
      }) as any);

      const { GET } = await import('@/app/api/sso/config/route');
      const request = new NextRequest('http://localhost:3000/api/sso/config?organizationId=org-123');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/sso/config', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { POST } = await import('@/app/api/sso/config/route');
      const request = new NextRequest('http://localhost:3000/api/sso/config', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: 'org-123',
          provider: 'saml',
          domain: 'company.com',
          config: {},
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 when user is not enterprise', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'user@example.com', plan: 'pro' },
      } as any);

      const { POST } = await import('@/app/api/sso/config/route');
      const request = new NextRequest('http://localhost:3000/api/sso/config', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: 'org-123',
          provider: 'saml',
          domain: 'company.com',
          config: {},
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should return 400 for invalid request body', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@company.com', plan: 'enterprise' },
      } as any);

      const { POST } = await import('@/app/api/sso/config/route');
      const request = new NextRequest('http://localhost:3000/api/sso/config', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          provider: 'saml',
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should create SSO config for enterprise user with valid SAML config', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@company.com', plan: 'enterprise' },
      } as any);

      const mockSet = vi.fn().mockResolvedValue(undefined);
      vi.mocked(adminDb.collection).mockImplementation(() => ({
        doc: vi.fn(() => ({
          set: mockSet,
          get: vi.fn().mockResolvedValue({ exists: false }),
        })),
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
          })),
        })),
      }) as any);

      const validCert = 'MIICpDCCAYwCCQDU+pQ4P4FkOzANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAkxMjcuMC4wLjEwHhcNMjMwMTAxMDAwMDAwWhcNMjQwMTAxMDAwMDAwWjAUMRIwEAYDVQQDDAkxMjcuMC4wLjEwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7o5e7xxx';

      const { POST } = await import('@/app/api/sso/config/route');
      const request = new NextRequest('http://localhost:3000/api/sso/config', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: 'org-123',
          provider: 'saml',
          domain: 'company.com',
          config: {
            entryPoint: 'https://idp.company.com/sso',
            issuer: 'md2pdf',
            cert: validCert,
            callbackUrl: 'https://md2pdf.com/callback',
          },
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/sso/config/[configId]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { GET } = await import('@/app/api/sso/config/[configId]/route');
      const request = new NextRequest('http://localhost:3000/api/sso/config/sso-123');
      const response = await GET(request, { params: { configId: 'sso-123' } });

      expect(response.status).toBe(401);
    });

    it('should return SSO config by ID', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@company.com', plan: 'enterprise' },
      } as any);

      const mockConfig = {
        id: 'sso-123',
        organizationId: 'org-123',
        provider: 'azure_ad',
        status: 'active',
      };

      vi.mocked(adminDb.collection).mockImplementation(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => mockConfig,
          }),
        })),
      }) as any);

      const { GET } = await import('@/app/api/sso/config/[configId]/route');
      const request = new NextRequest('http://localhost:3000/api/sso/config/sso-123');
      const response = await GET(request, { params: { configId: 'sso-123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.config.provider).toBe('azure_ad');
    });

    it('should return 404 when config not found', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@company.com', plan: 'enterprise' },
      } as any);

      vi.mocked(adminDb.collection).mockImplementation(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({ exists: false }),
        })),
      }) as any);

      const { GET } = await import('@/app/api/sso/config/[configId]/route');
      const request = new NextRequest('http://localhost:3000/api/sso/config/nonexistent');
      const response = await GET(request, { params: { configId: 'nonexistent' } });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/sso/config/[configId]/test', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { POST } = await import('@/app/api/sso/config/[configId]/test/route');
      const request = new NextRequest('http://localhost:3000/api/sso/config/sso-123/test', {
        method: 'POST',
      });
      const response = await POST(request, { params: { configId: 'sso-123' } });

      expect(response.status).toBe(401);
    });

    it('should test SSO configuration', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@company.com', plan: 'enterprise' },
      } as any);

      const validCert = 'MIICpDCCAYwCCQDU+pQ4P4FkOzANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAkxMjcuMC4wLjEwHhcNMjMwMTAxMDAwMDAwWhcNMjQwMTAxMDAwMDAwWjAUMRIwEAYDVQQDDAkxMjcuMC4wLjEwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7o5e7xxx';
      const mockConfig = {
        id: 'sso-123',
        organizationId: 'org-123',
        provider: 'saml',
        config: {
          entryPoint: 'https://idp.company.com/sso',
          issuer: 'md2pdf',
          cert: validCert,
          callbackUrl: 'https://md2pdf.com/callback',
        },
      };

      vi.mocked(adminDb.collection).mockImplementation(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => mockConfig,
          }),
          update: vi.fn().mockResolvedValue(undefined),
          set: vi.fn().mockResolvedValue(undefined),
        })),
      }) as any);

      const { POST } = await import('@/app/api/sso/config/[configId]/test/route');
      const request = new NextRequest('http://localhost:3000/api/sso/config/sso-123/test', {
        method: 'POST',
      });
      const response = await POST(request, { params: { configId: 'sso-123' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.result).toBeDefined();
    });
  });

  describe('GET /api/sso/metadata', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { GET } = await import('@/app/api/sso/metadata/route');
      const request = new NextRequest('http://localhost:3000/api/sso/metadata');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return SP metadata for enterprise user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@company.com', plan: 'enterprise' },
      } as any);

      const { GET } = await import('@/app/api/sso/metadata/route');
      const request = new NextRequest('http://localhost:3000/api/sso/metadata');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.metadata).toBeDefined();
      expect(data.metadata.entityId).toBeDefined();
      expect(data.metadata.acsUrl).toBeDefined();
    });
  });

  describe('POST /api/sso/check', () => {
    it('should check if email should use SSO', async () => {
      vi.mocked(adminDb.collection).mockImplementation((name: string) => {
        if (name === 'sso_domains') {
          return {
            where: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn(() => ({
                  get: vi.fn().mockResolvedValue({
                    empty: false,
                    docs: [
                      {
                        data: () => ({
                          domain: 'sso-company.com',
                          verified: true,
                          ssoConfigId: 'sso-123',
                        }),
                      },
                    ],
                  }),
                })),
              })),
            })),
          } as any;
        }
        return {
          doc: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({
              exists: true,
              data: () => ({
                id: 'sso-123',
                status: 'active',
                enforceSSO: true,
                provider: 'saml',
              }),
            }),
          })),
        } as any;
      });

      const { POST } = await import('@/app/api/sso/check/route');
      const request = new NextRequest('http://localhost:3000/api/sso/check', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@sso-company.com' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.useSSO).toBe(true);
      expect(data.enforced).toBe(true);
    });

    it('should return useSSO false for non-SSO domain', async () => {
      vi.mocked(adminDb.collection).mockImplementation(() => ({
        where: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
            })),
          })),
          limit: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
          })),
        })),
      }) as any);

      const { POST } = await import('@/app/api/sso/check/route');
      const request = new NextRequest('http://localhost:3000/api/sso/check', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@regular-company.com' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.useSSO).toBe(false);
    });

    it('should return 400 for missing email', async () => {
      const { POST } = await import('@/app/api/sso/check/route');
      const request = new NextRequest('http://localhost:3000/api/sso/check', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/sso/audit', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { GET } = await import('@/app/api/sso/audit/route');
      const request = new NextRequest('http://localhost:3000/api/sso/audit?organizationId=org-123');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return 400 when organizationId is missing', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@company.com', plan: 'enterprise' },
      } as any);

      const { GET } = await import('@/app/api/sso/audit/route');
      const request = new NextRequest('http://localhost:3000/api/sso/audit');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should return audit logs for enterprise user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@company.com', plan: 'enterprise' },
      } as any);

      const mockLogs = [
        { id: 'audit-1', action: 'login', timestamp: '2024-01-01' },
        { id: 'audit-2', action: 'config_updated', timestamp: '2024-01-02' },
      ];

      vi.mocked(adminDb.collection).mockImplementation(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: vi.fn().mockResolvedValue({
                docs: mockLogs.map((log) => ({ data: () => log })),
              }),
            })),
          })),
        })),
      }) as any);

      const { GET } = await import('@/app/api/sso/audit/route');
      const request = new NextRequest('http://localhost:3000/api/sso/audit?organizationId=org-123');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.logs).toHaveLength(2);
    });
  });

  describe('GET /api/sso/domains', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { GET } = await import('@/app/api/sso/domains/route');
      const request = new NextRequest('http://localhost:3000/api/sso/domains?organizationId=org-123');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return domain mappings for enterprise user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@company.com', plan: 'enterprise' },
      } as any);

      const mockDomains = [
        { domain: 'company.com', verified: true },
        { domain: 'subsidiary.com', verified: false },
      ];

      vi.mocked(adminDb.collection).mockImplementation(() => ({
        where: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({
            docs: mockDomains.map((d) => ({ data: () => d })),
          }),
        })),
      }) as any);

      const { GET } = await import('@/app/api/sso/domains/route');
      const request = new NextRequest('http://localhost:3000/api/sso/domains?organizationId=org-123');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.domains).toHaveLength(2);
    });
  });

  describe('POST /api/sso/domains', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { POST } = await import('@/app/api/sso/domains/route');
      const request = new NextRequest('http://localhost:3000/api/sso/domains', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: 'org-123',
          domain: 'newdomain.com',
          ssoConfigId: 'sso-123',
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should create domain mapping for enterprise user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@company.com', plan: 'enterprise' },
      } as any);

      const mockSet = vi.fn().mockResolvedValue(undefined);
      vi.mocked(adminDb.collection).mockImplementation(() => ({
        doc: vi.fn(() => ({
          set: mockSet,
          get: vi.fn().mockResolvedValue({ exists: false }),
        })),
      }) as any);

      const { POST } = await import('@/app/api/sso/domains/route');
      const request = new NextRequest('http://localhost:3000/api/sso/domains', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: 'org-123',
          domain: 'newdomain.com',
          ssoConfigId: 'sso-123',
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('GET /api/sso/domains/[domain]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { GET } = await import('@/app/api/sso/domains/[domain]/route');
      const request = new NextRequest('http://localhost:3000/api/sso/domains/company.com');
      const response = await GET(request, { params: { domain: 'company.com' } });

      expect(response.status).toBe(401);
    });

    it('should return domain mapping', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@company.com', plan: 'enterprise' },
      } as any);

      const mockMapping = {
        domain: 'company.com',
        verified: true,
        verificationToken: null,
      };

      vi.mocked(adminDb.collection).mockImplementation(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => mockMapping,
          }),
        })),
      }) as any);

      const { GET } = await import('@/app/api/sso/domains/[domain]/route');
      const request = new NextRequest('http://localhost:3000/api/sso/domains/company.com');
      const response = await GET(request, { params: { domain: 'company.com' } });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/sso/domains/[domain]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { DELETE } = await import('@/app/api/sso/domains/[domain]/route');
      const request = new NextRequest('http://localhost:3000/api/sso/domains/company.com', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { domain: 'company.com' } });

      expect(response.status).toBe(401);
    });

    it('should delete domain mapping for enterprise user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@company.com', plan: 'enterprise' },
      } as any);

      const mockDelete = vi.fn().mockResolvedValue(undefined);
      vi.mocked(adminDb.collection).mockImplementation(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({ exists: true }),
          delete: mockDelete,
        })),
      }) as any);

      const { DELETE } = await import('@/app/api/sso/domains/[domain]/route');
      const request = new NextRequest('http://localhost:3000/api/sso/domains/company.com', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { domain: 'company.com' } });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/sso/domains/[domain]/verify', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { POST } = await import('@/app/api/sso/domains/[domain]/verify/route');
      const request = new NextRequest('http://localhost:3000/api/sso/domains/company.com/verify', {
        method: 'POST',
      });
      const response = await POST(request, { params: { domain: 'company.com' } });

      expect(response.status).toBe(401);
    });

    it('should verify domain mapping for enterprise user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@company.com', plan: 'enterprise' },
      } as any);

      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      vi.mocked(adminDb.collection).mockImplementation(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              domain: 'company.com',
              verificationToken: 'md2pdf-verify-xxx',
              verified: false,
            }),
          }),
          update: mockUpdate,
        })),
      }) as any);

      const { POST } = await import('@/app/api/sso/domains/[domain]/verify/route');
      const request = new NextRequest('http://localhost:3000/api/sso/domains/company.com/verify', {
        method: 'POST',
      });
      const response = await POST(request, { params: { domain: 'company.com' } });

      expect(response.status).toBe(200);
    });
  });
});
