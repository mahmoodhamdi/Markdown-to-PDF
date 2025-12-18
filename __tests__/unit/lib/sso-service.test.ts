/**
 * SSO Service Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
}));

import {
  createSSOConfig,
  getSSOConfig,
  getSSOConfigByOrganization,
  getSSOConfigByDomain,
  updateSSOConfig,
  deleteSSOConfig,
  activateSSOConfig,
  deactivateSSOConfig,
  createDomainMapping,
  verifyDomainMapping,
  getDomainMapping,
  deleteDomainMapping,
  testSSOConfig,
  generateSPMetadata,
  logSSOAudit,
  getSSOAuditLogs,
  shouldUseSSO,
  recordSSOLogin,
  recordSSOLogout,
  getAllSSOConfigs,
} from '@/lib/sso/service';
import { adminDb } from '@/lib/firebase/admin';
import type { SAMLConfig, OIDCConfig, AzureADConfig, OktaConfig, GoogleWorkspaceConfig } from '@/lib/sso/types';

describe('SSO Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createSSOConfig', () => {
    it('should create a new SSO configuration with SAML provider', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockDoc = vi.fn(() => ({ set: mockSet, get: vi.fn().mockResolvedValue({ exists: false }) }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const samlConfig: SAMLConfig = {
        entryPoint: 'https://idp.example.com/sso',
        issuer: 'md2pdf-sp',
        cert: 'MIIC...certificate...',
        callbackUrl: 'https://md2pdf.com/api/auth/saml/callback',
      };

      const result = await createSSOConfig(
        'org-123',
        'saml',
        samlConfig,
        'example.com',
        { enforceSSO: true, jitProvisioning: true }
      );

      expect(result).toMatchObject({
        organizationId: 'org-123',
        provider: 'saml',
        domain: 'example.com',
        status: 'pending',
        enforceSSO: true,
        jitProvisioning: true,
      });
      expect(result.id).toMatch(/^sso_/);
    });

    it('should normalize domain to lowercase', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockDoc = vi.fn(() => ({ set: mockSet, get: vi.fn().mockResolvedValue({ exists: false }) }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await createSSOConfig(
        'org-123',
        'oidc',
        { clientId: 'test', clientSecret: 'secret', issuer: 'https://issuer.com' } as OIDCConfig,
        'EXAMPLE.COM'
      );

      expect(result.domain).toBe('example.com');
    });

    it('should use default options when not provided', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockDoc = vi.fn(() => ({ set: mockSet, get: vi.fn().mockResolvedValue({ exists: false }) }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await createSSOConfig(
        'org-123',
        'okta',
        { domain: 'test.okta.com', clientId: 'id', clientSecret: 'secret' } as OktaConfig,
        'example.com'
      );

      expect(result.enforceSSO).toBe(false);
      expect(result.allowBypass).toBe(true);
      expect(result.jitProvisioning).toBe(true);
      expect(result.defaultRole).toBe('member');
    });
  });

  describe('getSSOConfig', () => {
    it('should return SSO configuration by ID', async () => {
      const mockConfig = {
        id: 'sso-123',
        organizationId: 'org-123',
        provider: 'saml',
        status: 'active',
      };
      const mockGet = vi.fn().mockResolvedValue({ exists: true, data: () => mockConfig });
      const mockDoc = vi.fn(() => ({ get: mockGet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await getSSOConfig('sso-123');

      expect(result).toEqual(mockConfig);
    });

    it('should return null when configuration not found', async () => {
      const mockGet = vi.fn().mockResolvedValue({ exists: false });
      const mockDoc = vi.fn(() => ({ get: mockGet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await getSSOConfig('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getSSOConfigByOrganization', () => {
    it('should return SSO configuration for organization', async () => {
      const mockConfig = {
        id: 'sso-123',
        organizationId: 'org-123',
        provider: 'azure_ad',
      };
      const mockGet = vi.fn().mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockConfig }],
      });
      const mockLimit = vi.fn(() => ({ get: mockGet }));
      const mockWhere = vi.fn(() => ({ limit: mockLimit }));
      const mockCollection = vi.fn(() => ({ where: mockWhere }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await getSSOConfigByOrganization('org-123');

      expect(result).toEqual(mockConfig);
    });

    it('should return null when no configuration found for organization', async () => {
      const mockGet = vi.fn().mockResolvedValue({ empty: true, docs: [] });
      const mockLimit = vi.fn(() => ({ get: mockGet }));
      const mockWhere = vi.fn(() => ({ limit: mockLimit }));
      const mockCollection = vi.fn(() => ({ where: mockWhere }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await getSSOConfigByOrganization('nonexistent-org');

      expect(result).toBeNull();
    });
  });

  describe('getSSOConfigByDomain', () => {
    it('should return SSO configuration by verified domain mapping', async () => {
      const mockDomainMapping = {
        domain: 'example.com',
        ssoConfigId: 'sso-123',
        verified: true,
      };
      const mockConfig = {
        id: 'sso-123',
        provider: 'google_workspace',
      };

      let callCount = 0;
      vi.mocked(adminDb.collection).mockImplementation((name: string) => {
        if (name === 'sso_domains') {
          return {
            where: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn(() => ({
                  get: vi.fn().mockResolvedValue({
                    empty: false,
                    docs: [{ data: () => mockDomainMapping }],
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
              data: () => mockConfig,
            }),
          })),
        } as any;
      });

      const result = await getSSOConfigByDomain('example.com');

      expect(result).toMatchObject({ id: 'sso-123', provider: 'google_workspace' });
    });

    it('should normalize domain to lowercase', async () => {
      const mockGet = vi.fn().mockResolvedValue({ empty: true, docs: [] });
      const mockLimit = vi.fn(() => ({ get: mockGet }));
      const mockWhereInner = vi.fn(() => ({ limit: mockLimit }));
      const mockWhere = vi.fn(() => ({ where: mockWhereInner, limit: mockLimit }));
      const mockCollection = vi.fn(() => ({ where: mockWhere }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      await getSSOConfigByDomain('EXAMPLE.COM');

      expect(mockWhere).toHaveBeenCalledWith('domain', '==', 'example.com');
    });
  });

  describe('updateSSOConfig', () => {
    it('should update SSO configuration', async () => {
      const existingConfig = {
        id: 'sso-123',
        organizationId: 'org-123',
        status: 'pending',
        enforceSSO: false,
      };
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({ exists: true, data: () => existingConfig });
      const mockDoc = vi.fn(() => ({ get: mockGet, update: mockUpdate, set: mockSet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await updateSSOConfig('sso-123', { status: 'active', enforceSSO: true });

      expect(result).toMatchObject({
        id: 'sso-123',
        status: 'active',
        enforceSSO: true,
      });
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should return null when configuration not found', async () => {
      const mockGet = vi.fn().mockResolvedValue({ exists: false });
      const mockDoc = vi.fn(() => ({ get: mockGet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await updateSSOConfig('nonexistent', { status: 'active' });

      expect(result).toBeNull();
    });
  });

  describe('deleteSSOConfig', () => {
    it('should delete SSO configuration and associated domain mappings', async () => {
      const mockConfig = {
        id: 'sso-123',
        organizationId: 'org-123',
      };
      const mockDomainDocs = [{ ref: 'domain-ref-1' }, { ref: 'domain-ref-2' }];
      const mockBatchDelete = vi.fn();
      const mockBatchCommit = vi.fn().mockResolvedValue(undefined);

      vi.mocked(adminDb.collection).mockImplementation((name: string) => {
        if (name === 'sso_configurations') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn().mockResolvedValue({ exists: true, data: () => mockConfig }),
            })),
          } as any;
        }
        if (name === 'sso_domains') {
          return {
            where: vi.fn(() => ({
              get: vi.fn().mockResolvedValue({ docs: mockDomainDocs }),
            })),
          } as any;
        }
        return {
          doc: vi.fn(() => ({ set: vi.fn() })),
        } as any;
      });

      vi.mocked(adminDb.batch).mockReturnValue({
        delete: mockBatchDelete,
        commit: mockBatchCommit,
      } as any);

      const result = await deleteSSOConfig('sso-123');

      expect(result).toBe(true);
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it('should return false when configuration not found', async () => {
      const mockGet = vi.fn().mockResolvedValue({ exists: false });
      const mockDoc = vi.fn(() => ({ get: mockGet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await deleteSSOConfig('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('activateSSOConfig', () => {
    it('should activate SSO configuration', async () => {
      const existingConfig = { id: 'sso-123', organizationId: 'org-123', status: 'pending' };
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({ exists: true, data: () => existingConfig });
      const mockDoc = vi.fn(() => ({ get: mockGet, update: mockUpdate, set: mockSet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await activateSSOConfig('sso-123');

      expect(result?.status).toBe('active');
    });
  });

  describe('deactivateSSOConfig', () => {
    it('should deactivate SSO configuration', async () => {
      const existingConfig = { id: 'sso-123', organizationId: 'org-123', status: 'active' };
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({ exists: true, data: () => existingConfig });
      const mockDoc = vi.fn(() => ({ get: mockGet, update: mockUpdate, set: mockSet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await deactivateSSOConfig('sso-123');

      expect(result?.status).toBe('inactive');
    });
  });

  describe('createDomainMapping', () => {
    it('should create a domain mapping with verification token', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockDoc = vi.fn(() => ({ set: mockSet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await createDomainMapping('example.com', 'org-123', 'sso-123');

      expect(result).toMatchObject({
        domain: 'example.com',
        organizationId: 'org-123',
        ssoConfigId: 'sso-123',
        verified: false,
        verificationMethod: 'dns',
      });
      expect(result.verificationToken).toMatch(/^md2pdf-verify-/);
    });

    it('should normalize domain to lowercase', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockDoc = vi.fn(() => ({ set: mockSet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await createDomainMapping('EXAMPLE.COM', 'org-123', 'sso-123');

      expect(result.domain).toBe('example.com');
      expect(mockDoc).toHaveBeenCalledWith('example.com');
    });
  });

  describe('verifyDomainMapping', () => {
    it('should verify a domain mapping', async () => {
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({ exists: true });
      const mockDoc = vi.fn(() => ({ get: mockGet, update: mockUpdate }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await verifyDomainMapping('example.com');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        verified: true,
        verificationToken: null,
      });
    });

    it('should return false when domain mapping not found', async () => {
      const mockGet = vi.fn().mockResolvedValue({ exists: false });
      const mockDoc = vi.fn(() => ({ get: mockGet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await verifyDomainMapping('nonexistent.com');

      expect(result).toBe(false);
    });
  });

  describe('getDomainMapping', () => {
    it('should return domain mapping', async () => {
      const mockMapping = {
        domain: 'example.com',
        verified: true,
        ssoConfigId: 'sso-123',
      };
      const mockGet = vi.fn().mockResolvedValue({ exists: true, data: () => mockMapping });
      const mockDoc = vi.fn(() => ({ get: mockGet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await getDomainMapping('example.com');

      expect(result).toEqual(mockMapping);
    });

    it('should return null when domain mapping not found', async () => {
      const mockGet = vi.fn().mockResolvedValue({ exists: false });
      const mockDoc = vi.fn(() => ({ get: mockGet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await getDomainMapping('nonexistent.com');

      expect(result).toBeNull();
    });
  });

  describe('deleteDomainMapping', () => {
    it('should delete a domain mapping', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({ exists: true });
      const mockDoc = vi.fn(() => ({ get: mockGet, delete: mockDelete }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await deleteDomainMapping('example.com');

      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should return false when domain mapping not found', async () => {
      const mockGet = vi.fn().mockResolvedValue({ exists: false });
      const mockDoc = vi.fn(() => ({ get: mockGet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await deleteDomainMapping('nonexistent.com');

      expect(result).toBe(false);
    });
  });

  describe('testSSOConfig', () => {
    it('should return error when configuration not found', async () => {
      const mockGet = vi.fn().mockResolvedValue({ exists: false });
      const mockDoc = vi.fn(() => ({ get: mockGet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await testSSOConfig('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not exist');
    });

    it('should test valid SAML configuration', async () => {
      // Generate a valid base64 string that's long enough (100+ chars after decoding)
      const validCertContent = 'MIICpDCCAYwCCQDU+pQ4P4FkOzANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAkxMjcuMC4wLjEwHhcNMjMwMTAxMDAwMDAwWhcNMjQwMTAxMDAwMDAwWjAUMRIwEAYDVQQDDAkxMjcuMC4wLjEwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7o5e7';
      const mockConfig = {
        id: 'sso-123',
        organizationId: 'org-123',
        provider: 'saml',
        config: {
          entryPoint: 'https://idp.example.com/sso',
          issuer: 'md2pdf-sp',
          cert: `-----BEGIN CERTIFICATE-----\n${validCertContent}\n-----END CERTIFICATE-----`,
          callbackUrl: 'https://md2pdf.com/callback',
        },
      };
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({ exists: true, data: () => mockConfig });
      const mockDoc = vi.fn(() => ({ get: mockGet, update: mockUpdate, set: mockSet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await testSSOConfig('sso-123');

      expect(result.success).toBe(true);
      expect(result.provider).toBe('saml');
    });

    it('should fail for invalid SAML entry point URL', async () => {
      const mockConfig = {
        id: 'sso-123',
        organizationId: 'org-123',
        provider: 'saml',
        config: {
          entryPoint: 'not-a-valid-url',
          issuer: 'md2pdf-sp',
          cert: 'test-cert',
          callbackUrl: 'https://md2pdf.com/callback',
        },
      };
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn().mockResolvedValue({ exists: true, data: () => mockConfig });
      const mockDoc = vi.fn(() => ({ get: mockGet, update: mockUpdate, set: vi.fn() }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await testSSOConfig('sso-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not a valid URL');
    });
  });

  describe('generateSPMetadata', () => {
    it('should generate valid SAML SP metadata', () => {
      const result = generateSPMetadata(
        'https://md2pdf.com/sp',
        'https://md2pdf.com/api/auth/saml/callback',
        'https://md2pdf.com/api/auth/saml/logout'
      );

      expect(result.entityId).toBe('https://md2pdf.com/sp');
      expect(result.acsUrl).toBe('https://md2pdf.com/api/auth/saml/callback');
      expect(result.sloUrl).toBe('https://md2pdf.com/api/auth/saml/logout');
      expect(result.metadataXml).toContain('EntityDescriptor');
      expect(result.metadataXml).toContain('SPSSODescriptor');
      expect(result.metadataXml).toContain('AssertionConsumerService');
      expect(result.metadataXml).toContain('SingleLogoutService');
    });

    it('should generate metadata without SLO when not provided', () => {
      const result = generateSPMetadata(
        'https://md2pdf.com/sp',
        'https://md2pdf.com/api/auth/saml/callback'
      );

      expect(result.sloUrl).toBeUndefined();
      expect(result.metadataXml).not.toContain('SingleLogoutService');
    });
  });

  describe('logSSOAudit', () => {
    it('should log SSO audit event', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockDoc = vi.fn(() => ({ set: mockSet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      await logSSOAudit(
        'org-123',
        'login',
        'user-123',
        'user@example.com',
        'sso-123',
        { browser: 'Chrome' },
        '192.168.1.1',
        'Mozilla/5.0...'
      );

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-123',
          action: 'login',
          userId: 'user-123',
          userEmail: 'user@example.com',
          ssoConfigId: 'sso-123',
          ipAddress: '192.168.1.1',
        })
      );
    });
  });

  describe('getSSOAuditLogs', () => {
    it('should return audit logs for organization', async () => {
      const mockLogs = [
        { id: 'audit-1', action: 'login', timestamp: '2024-01-01' },
        { id: 'audit-2', action: 'logout', timestamp: '2024-01-02' },
      ];
      const mockGet = vi.fn().mockResolvedValue({
        docs: mockLogs.map((log) => ({ data: () => log })),
      });
      const mockLimit = vi.fn(() => ({ get: mockGet }));
      const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
      const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
      const mockCollection = vi.fn(() => ({ where: mockWhere }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await getSSOAuditLogs('org-123');

      expect(result).toEqual(mockLogs);
    });

    it('should use custom limit', async () => {
      const mockGet = vi.fn().mockResolvedValue({ docs: [] });
      const mockLimit = vi.fn(() => ({ get: mockGet }));
      const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
      const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
      const mockCollection = vi.fn(() => ({ where: mockWhere }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      await getSSOAuditLogs('org-123', 100);

      expect(mockLimit).toHaveBeenCalledWith(100);
    });
  });

  describe('shouldUseSSO', () => {
    it('should return useSSO true when active SSO config exists for domain', async () => {
      const mockConfig = {
        id: 'sso-123',
        status: 'active',
        enforceSSO: true,
      };

      vi.mocked(adminDb.collection).mockImplementation((name: string) => {
        if (name === 'sso_domains') {
          return {
            where: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn(() => ({
                  get: vi.fn().mockResolvedValue({
                    empty: false,
                    docs: [{ data: () => ({ ssoConfigId: 'sso-123', verified: true }) }],
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
              data: () => mockConfig,
            }),
          })),
        } as any;
      });

      const result = await shouldUseSSO('user@example.com');

      expect(result.useSSO).toBe(true);
      expect(result.enforced).toBe(true);
    });

    it('should return useSSO false when no SSO config exists', async () => {
      const mockGet = vi.fn().mockResolvedValue({ empty: true, docs: [] });
      const mockLimit = vi.fn(() => ({ get: mockGet }));
      const mockWhereInner = vi.fn(() => ({ limit: mockLimit }));
      const mockWhere = vi.fn(() => ({ where: mockWhereInner, limit: mockLimit }));
      const mockCollection = vi.fn(() => ({ where: mockWhere }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      const result = await shouldUseSSO('user@example.com');

      expect(result.useSSO).toBe(false);
      expect(result.enforced).toBe(false);
    });

    it('should return useSSO false for invalid email', async () => {
      const result = await shouldUseSSO('invalid-email');

      expect(result.useSSO).toBe(false);
    });
  });

  describe('recordSSOLogin', () => {
    it('should log SSO login event', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockDoc = vi.fn(() => ({ set: mockSet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      await recordSSOLogin(
        'user-123',
        'org-123',
        'sso-123',
        'saml',
        '192.168.1.1',
        'Mozilla/5.0...'
      );

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login',
          organizationId: 'org-123',
          userId: 'user-123',
        })
      );
    });
  });

  describe('recordSSOLogout', () => {
    it('should log SSO logout event', async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      const mockDoc = vi.fn(() => ({ set: mockSet }));
      const mockCollection = vi.fn(() => ({ doc: mockDoc }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection);

      await recordSSOLogout('user-123', 'org-123', 'sso-123');

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'logout',
          organizationId: 'org-123',
          userId: 'user-123',
        })
      );
    });
  });

  describe('getAllSSOConfigs', () => {
    it('should return all SSO configurations', async () => {
      const mockConfigs = [
        { id: 'sso-1', status: 'active' },
        { id: 'sso-2', status: 'pending' },
      ];
      const mockGet = vi.fn().mockResolvedValue({
        docs: mockConfigs.map((config) => ({ data: () => config })),
      });
      const mockCollection = vi.fn(() => ({ get: mockGet }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection as any);

      const result = await getAllSSOConfigs();

      expect(result).toEqual(mockConfigs);
    });

    it('should filter by status when provided', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        docs: [{ data: () => ({ id: 'sso-1', status: 'active' }) }],
      });
      const mockWhere = vi.fn(() => ({ get: mockGet }));
      const mockCollection = vi.fn(() => ({ where: mockWhere }));
      vi.mocked(adminDb.collection).mockImplementation(mockCollection as any);

      await getAllSSOConfigs('active');

      expect(mockWhere).toHaveBeenCalledWith('status', '==', 'active');
    });
  });

  describe('Provider-specific test functions', () => {
    describe('OIDC configuration test', () => {
      it('should validate valid OIDC configuration', async () => {
        const mockConfig = {
          id: 'sso-123',
          organizationId: 'org-123',
          provider: 'oidc',
          config: {
            issuer: 'https://auth.example.com',
            clientId: 'client-12345',
            clientSecret: 'super-secret-key-12345',
          },
        };
        const mockUpdate = vi.fn().mockResolvedValue(undefined);
        const mockGet = vi.fn().mockResolvedValue({ exists: true, data: () => mockConfig });
        const mockDoc = vi.fn(() => ({ get: mockGet, update: mockUpdate, set: vi.fn() }));
        const mockCollection = vi.fn(() => ({ doc: mockDoc }));
        vi.mocked(adminDb.collection).mockImplementation(mockCollection);

        const result = await testSSOConfig('sso-123');

        expect(result.success).toBe(true);
        expect(result.provider).toBe('oidc');
      });

      it('should fail for invalid issuer URL', async () => {
        const mockConfig = {
          id: 'sso-123',
          organizationId: 'org-123',
          provider: 'oidc',
          config: {
            issuer: 'not-a-url',
            clientId: 'client-12345',
            clientSecret: 'super-secret-key',
          },
        };
        const mockUpdate = vi.fn().mockResolvedValue(undefined);
        const mockGet = vi.fn().mockResolvedValue({ exists: true, data: () => mockConfig });
        const mockDoc = vi.fn(() => ({ get: mockGet, update: mockUpdate, set: vi.fn() }));
        const mockCollection = vi.fn(() => ({ doc: mockDoc }));
        vi.mocked(adminDb.collection).mockImplementation(mockCollection);

        const result = await testSSOConfig('sso-123');

        expect(result.success).toBe(false);
      });
    });

    describe('Azure AD configuration test', () => {
      it('should validate valid Azure AD configuration', async () => {
        const mockConfig = {
          id: 'sso-123',
          organizationId: 'org-123',
          provider: 'azure_ad',
          config: {
            tenantId: '12345678-1234-1234-1234-123456789012',
            clientId: '12345678-1234-1234-1234-123456789012',
            clientSecret: 'super-secret-key-12345',
          },
        };
        const mockUpdate = vi.fn().mockResolvedValue(undefined);
        const mockGet = vi.fn().mockResolvedValue({ exists: true, data: () => mockConfig });
        const mockDoc = vi.fn(() => ({ get: mockGet, update: mockUpdate, set: vi.fn() }));
        const mockCollection = vi.fn(() => ({ doc: mockDoc }));
        vi.mocked(adminDb.collection).mockImplementation(mockCollection);

        const result = await testSSOConfig('sso-123');

        expect(result.success).toBe(true);
        expect(result.provider).toBe('azure_ad');
      });

      it('should fail for invalid tenant ID format', async () => {
        const mockConfig = {
          id: 'sso-123',
          organizationId: 'org-123',
          provider: 'azure_ad',
          config: {
            tenantId: 'not-a-guid',
            clientId: '12345678-1234-1234-1234-123456789012',
            clientSecret: 'super-secret-key',
          },
        };
        const mockUpdate = vi.fn().mockResolvedValue(undefined);
        const mockGet = vi.fn().mockResolvedValue({ exists: true, data: () => mockConfig });
        const mockDoc = vi.fn(() => ({ get: mockGet, update: mockUpdate, set: vi.fn() }));
        const mockCollection = vi.fn(() => ({ doc: mockDoc }));
        vi.mocked(adminDb.collection).mockImplementation(mockCollection);

        const result = await testSSOConfig('sso-123');

        expect(result.success).toBe(false);
        expect(result.error).toContain('GUID');
      });
    });

    describe('Okta configuration test', () => {
      it('should validate valid Okta configuration', async () => {
        const mockConfig = {
          id: 'sso-123',
          organizationId: 'org-123',
          provider: 'okta',
          config: {
            domain: 'myorg.okta.com',
            clientId: 'client-id-12345',
            clientSecret: 'super-secret-key-12345',
          },
        };
        const mockUpdate = vi.fn().mockResolvedValue(undefined);
        const mockGet = vi.fn().mockResolvedValue({ exists: true, data: () => mockConfig });
        const mockDoc = vi.fn(() => ({ get: mockGet, update: mockUpdate, set: vi.fn() }));
        const mockCollection = vi.fn(() => ({ doc: mockDoc }));
        vi.mocked(adminDb.collection).mockImplementation(mockCollection);

        const result = await testSSOConfig('sso-123');

        expect(result.success).toBe(true);
        expect(result.provider).toBe('okta');
      });
    });

    describe('Google Workspace configuration test', () => {
      it('should validate valid Google Workspace configuration', async () => {
        const mockConfig = {
          id: 'sso-123',
          organizationId: 'org-123',
          provider: 'google_workspace',
          config: {
            domain: 'example.com',
            clientId: '123456789.apps.googleusercontent.com',
            clientSecret: 'super-secret-key-12345',
          },
        };
        const mockUpdate = vi.fn().mockResolvedValue(undefined);
        const mockGet = vi.fn().mockResolvedValue({ exists: true, data: () => mockConfig });
        const mockDoc = vi.fn(() => ({ get: mockGet, update: mockUpdate, set: vi.fn() }));
        const mockCollection = vi.fn(() => ({ doc: mockDoc }));
        vi.mocked(adminDb.collection).mockImplementation(mockCollection);

        const result = await testSSOConfig('sso-123');

        expect(result.success).toBe(true);
        expect(result.provider).toBe('google_workspace');
      });

      it('should fail for invalid Google client ID format', async () => {
        const mockConfig = {
          id: 'sso-123',
          organizationId: 'org-123',
          provider: 'google_workspace',
          config: {
            domain: 'example.com',
            clientId: 'not-a-valid-google-client-id',
            clientSecret: 'super-secret-key',
          },
        };
        const mockUpdate = vi.fn().mockResolvedValue(undefined);
        const mockGet = vi.fn().mockResolvedValue({ exists: true, data: () => mockConfig });
        const mockDoc = vi.fn(() => ({ get: mockGet, update: mockUpdate, set: vi.fn() }));
        const mockCollection = vi.fn(() => ({ doc: mockDoc }));
        vi.mocked(adminDb.collection).mockImplementation(mockCollection);

        const result = await testSSOConfig('sso-123');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Google OAuth client ID');
      });
    });
  });
});
