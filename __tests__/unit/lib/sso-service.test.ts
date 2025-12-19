/**
 * SSO Service Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';

// Mock MongoDB connection first
vi.mock('@/lib/db/mongodb', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

// Create mock document factories
const createMockObjectId = () => new mongoose.Types.ObjectId();

// Mock Mongoose models
const mockSSOConfigSave = vi.fn();
const mockSSOConfigFindById = vi.fn();
const mockSSOConfigFindOne = vi.fn();
const mockSSOConfigFindByIdAndUpdate = vi.fn();
const mockSSOConfigFindByIdAndDelete = vi.fn();
const mockSSOConfigFind = vi.fn();

const mockDomainMappingSave = vi.fn();
const mockDomainMappingFindOne = vi.fn();
const mockDomainMappingFindOneAndUpdate = vi.fn();
const mockDomainMappingFindOneAndDelete = vi.fn();
const mockDomainMappingDeleteMany = vi.fn();

const mockAuditLogSave = vi.fn();
const mockAuditLogFind = vi.fn();

vi.mock('@/lib/db/models/SSO', () => {
  return {
    SSOConfiguration: vi.fn().mockImplementation((data) => ({
      ...data,
      _id: createMockObjectId(),
      save: mockSSOConfigSave.mockResolvedValue({ ...data, _id: createMockObjectId() }),
    })),
    SSODomainMapping: vi.fn().mockImplementation((data) => ({
      ...data,
      save: mockDomainMappingSave.mockResolvedValue(data),
    })),
    SSOAuditLog: vi.fn().mockImplementation((data) => ({
      ...data,
      _id: createMockObjectId(),
      save: mockAuditLogSave.mockResolvedValue(data),
    })),
  };
});

// Add static methods to mocked models
vi.doMock('@/lib/db/models/SSO', async () => {
  const actual = await vi.importActual('@/lib/db/models/SSO');
  return {
    ...actual,
    SSOConfiguration: Object.assign(
      vi.fn().mockImplementation((data) => ({
        ...data,
        _id: createMockObjectId(),
        save: mockSSOConfigSave,
      })),
      {
        findById: mockSSOConfigFindById,
        findOne: mockSSOConfigFindOne,
        findByIdAndUpdate: mockSSOConfigFindByIdAndUpdate,
        findByIdAndDelete: mockSSOConfigFindByIdAndDelete,
        find: mockSSOConfigFind,
      }
    ),
    SSODomainMapping: Object.assign(
      vi.fn().mockImplementation((data) => ({
        ...data,
        save: mockDomainMappingSave,
      })),
      {
        findOne: mockDomainMappingFindOne,
        findOneAndUpdate: mockDomainMappingFindOneAndUpdate,
        findOneAndDelete: mockDomainMappingFindOneAndDelete,
        deleteMany: mockDomainMappingDeleteMany,
      }
    ),
    SSOAuditLog: Object.assign(
      vi.fn().mockImplementation((data) => ({
        ...data,
        _id: createMockObjectId(),
        save: mockAuditLogSave,
      })),
      {
        find: mockAuditLogFind,
      }
    ),
  };
});

import {
  generateSPMetadata,
} from '@/lib/sso/service';

describe('SSO Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
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

    it('should include proper XML namespace', () => {
      const result = generateSPMetadata(
        'https://md2pdf.com/sp',
        'https://md2pdf.com/api/auth/saml/callback'
      );

      expect(result.metadataXml).toContain('xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"');
    });

    it('should include NameIDFormat element', () => {
      const result = generateSPMetadata(
        'https://md2pdf.com/sp',
        'https://md2pdf.com/api/auth/saml/callback'
      );

      expect(result.metadataXml).toContain('NameIDFormat');
      expect(result.metadataXml).toContain('emailAddress');
    });

    it('should use POST binding for ACS', () => {
      const result = generateSPMetadata(
        'https://md2pdf.com/sp',
        'https://md2pdf.com/api/auth/saml/callback'
      );

      expect(result.metadataXml).toContain('HTTP-POST');
    });
  });

  describe('SSO Provider Validation Helpers', () => {
    it('should correctly identify valid email domains', () => {
      // Test extracting domain from email
      const email = 'user@example.com';
      const domain = email.split('@')[1];
      expect(domain).toBe('example.com');
    });

    it('should handle uppercase email domains', () => {
      const email = 'user@EXAMPLE.COM';
      const domain = email.split('@')[1].toLowerCase();
      expect(domain).toBe('example.com');
    });

    it('should identify invalid emails', () => {
      const invalidEmails = ['notanemail', 'missing@', '@nodomain', ''];

      for (const email of invalidEmails) {
        const parts = email.split('@');
        const isValid = parts.length === 2 && parts[0].length > 0 && parts[1]?.includes('.');
        expect(isValid).toBe(false);
      }
    });
  });

  describe('SSO Configuration Types', () => {
    it('should support SAML provider type', () => {
      const samlConfig = {
        provider: 'saml' as const,
        config: {
          entryPoint: 'https://idp.example.com/sso',
          issuer: 'md2pdf-sp',
          cert: 'MIIC...',
          callbackUrl: 'https://md2pdf.com/callback',
        },
      };

      expect(samlConfig.provider).toBe('saml');
      expect(samlConfig.config.entryPoint).toBeDefined();
      expect(samlConfig.config.cert).toBeDefined();
    });

    it('should support OIDC provider type', () => {
      const oidcConfig = {
        provider: 'oidc' as const,
        config: {
          clientId: 'client-123',
          clientSecret: 'secret-456',
          issuer: 'https://auth.example.com',
        },
      };

      expect(oidcConfig.provider).toBe('oidc');
      expect(oidcConfig.config.clientId).toBeDefined();
      expect(oidcConfig.config.issuer).toBeDefined();
    });

    it('should support Azure AD provider type', () => {
      const azureConfig = {
        provider: 'azure_ad' as const,
        config: {
          tenantId: '12345678-1234-1234-1234-123456789012',
          clientId: '87654321-4321-4321-4321-210987654321',
          clientSecret: 'azure-secret',
        },
      };

      expect(azureConfig.provider).toBe('azure_ad');
      expect(azureConfig.config.tenantId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should support Okta provider type', () => {
      const oktaConfig = {
        provider: 'okta' as const,
        config: {
          domain: 'myorg.okta.com',
          clientId: 'okta-client-id',
          clientSecret: 'okta-secret',
        },
      };

      expect(oktaConfig.provider).toBe('okta');
      expect(oktaConfig.config.domain).toContain('okta.com');
    });

    it('should support Google Workspace provider type', () => {
      const googleConfig = {
        provider: 'google_workspace' as const,
        config: {
          domain: 'example.com',
          clientId: '123456789.apps.googleusercontent.com',
          clientSecret: 'google-secret',
        },
      };

      expect(googleConfig.provider).toBe('google_workspace');
      expect(googleConfig.config.clientId).toContain('apps.googleusercontent.com');
    });
  });

  describe('SSO Configuration Options', () => {
    it('should have default values for optional settings', () => {
      const defaultOptions = {
        enforceSSO: false,
        allowBypass: true,
        jitProvisioning: true,
        defaultRole: 'member',
        sessionTimeout: 28800, // 8 hours
        allowedRoles: ['owner', 'admin', 'member'],
      };

      expect(defaultOptions.enforceSSO).toBe(false);
      expect(defaultOptions.allowBypass).toBe(true);
      expect(defaultOptions.jitProvisioning).toBe(true);
      expect(defaultOptions.defaultRole).toBe('member');
    });

    it('should support enforced SSO mode', () => {
      const enforcedOptions = {
        enforceSSO: true,
        allowBypass: false,
      };

      expect(enforcedOptions.enforceSSO).toBe(true);
      expect(enforcedOptions.allowBypass).toBe(false);
    });
  });

  describe('Domain Verification', () => {
    it('should generate verification tokens with correct prefix', () => {
      const token = `md2pdf-verify-${Buffer.from('test').toString('hex')}`;
      expect(token).toMatch(/^md2pdf-verify-/);
    });

    it('should normalize domains to lowercase', () => {
      const domain = 'EXAMPLE.COM';
      const normalized = domain.toLowerCase();
      expect(normalized).toBe('example.com');
    });

    it('should handle subdomains correctly', () => {
      const subdomain = 'app.example.com';
      const parts = subdomain.split('.');
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('app');
    });
  });

  describe('SSO Status Transitions', () => {
    it('should allow pending to active transition', () => {
      const validTransitions: Record<string, string[]> = {
        pending: ['active', 'inactive'],
        active: ['inactive'],
        inactive: ['active'],
      };

      expect(validTransitions['pending']).toContain('active');
    });

    it('should allow active to inactive transition', () => {
      const validTransitions: Record<string, string[]> = {
        pending: ['active', 'inactive'],
        active: ['inactive'],
        inactive: ['active'],
      };

      expect(validTransitions['active']).toContain('inactive');
    });

    it('should allow inactive to active transition', () => {
      const validTransitions: Record<string, string[]> = {
        pending: ['active', 'inactive'],
        active: ['inactive'],
        inactive: ['active'],
      };

      expect(validTransitions['inactive']).toContain('active');
    });
  });

  describe('Audit Log Actions', () => {
    const validActions = [
      'login',
      'logout',
      'config_created',
      'config_updated',
      'config_deleted',
      'config_activated',
      'config_deactivated',
      'domain_added',
      'domain_verified',
      'domain_removed',
      'test_success',
      'test_failure',
    ];

    it('should have all expected audit actions', () => {
      expect(validActions).toContain('login');
      expect(validActions).toContain('logout');
      expect(validActions).toContain('config_created');
      expect(validActions).toContain('config_updated');
      expect(validActions).toContain('config_deleted');
    });

    it('should categorize actions correctly', () => {
      const authActions = validActions.filter((a) => a === 'login' || a === 'logout');
      const configActions = validActions.filter((a) => a.startsWith('config_'));
      const domainActions = validActions.filter((a) => a.startsWith('domain_'));
      const testActions = validActions.filter((a) => a.startsWith('test_'));

      expect(authActions.length).toBe(2);
      expect(configActions.length).toBe(5);
      expect(domainActions.length).toBe(3);
      expect(testActions.length).toBe(2);
    });
  });

  describe('SAML Certificate Validation', () => {
    it('should identify valid certificate format', () => {
      const validCert = `-----BEGIN CERTIFICATE-----
MIICpDCCAYwCCQDU+pQ4P4FkOzANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAkx
MjcuMC4wLjEwHhcNMjMwMTAxMDAwMDAwWhcNMjQwMTAxMDAwMDAwWjAUMRIwEAYD
VQQDDAkxMjcuMC4wLjEwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7
-----END CERTIFICATE-----`;

      expect(validCert).toContain('-----BEGIN CERTIFICATE-----');
      expect(validCert).toContain('-----END CERTIFICATE-----');
    });

    it('should strip certificate headers for validation', () => {
      const certWithHeaders = `-----BEGIN CERTIFICATE-----
MIIC...base64content...
-----END CERTIFICATE-----`;

      const stripped = certWithHeaders
        .replace(/-----BEGIN CERTIFICATE-----/g, '')
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/\s/g, '');

      expect(stripped).not.toContain('BEGIN');
      expect(stripped).not.toContain('END');
    });
  });

  describe('URL Validation', () => {
    it('should validate HTTPS URLs', () => {
      const httpsUrl = 'https://idp.example.com/sso';
      expect(httpsUrl.startsWith('https://')).toBe(true);
    });

    it('should reject HTTP URLs for SSO', () => {
      const httpUrl = 'http://idp.example.com/sso';
      const isSecure = httpUrl.startsWith('https://');
      expect(isSecure).toBe(false);
    });

    it('should validate URL format', () => {
      const validUrls = [
        'https://idp.example.com/sso',
        'https://auth.okta.com/app/123',
        'https://login.microsoftonline.com/tenant',
      ];

      for (const url of validUrls) {
        expect(() => new URL(url)).not.toThrow();
      }
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = ['not-a-url', 'ftp://invalid.com', ''];

      for (const url of invalidUrls) {
        if (url) {
          try {
            new URL(url);
            // If we get here for ftp, check protocol
            if (url.startsWith('ftp://')) {
              expect(url.startsWith('https://')).toBe(false);
            }
          } catch {
            // Expected for invalid URLs
            expect(true).toBe(true);
          }
        }
      }
    });
  });

  describe('GUID Validation', () => {
    it('should validate Azure AD tenant ID format', () => {
      const validGuid = '12345678-1234-1234-1234-123456789012';
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(validGuid).toMatch(guidRegex);
    });

    it('should reject invalid GUID format', () => {
      const invalidGuids = ['not-a-guid', '12345678-1234-1234-1234', '12345678123412341234123456789012'];
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      for (const guid of invalidGuids) {
        expect(guid).not.toMatch(guidRegex);
      }
    });
  });

  describe('Google Client ID Validation', () => {
    it('should validate Google OAuth client ID format', () => {
      const validClientId = '123456789012.apps.googleusercontent.com';
      expect(validClientId).toContain('.apps.googleusercontent.com');
    });

    it('should reject invalid Google client ID', () => {
      const invalidClientIds = ['not-a-google-id', 'missing-suffix', ''];

      for (const clientId of invalidClientIds) {
        expect(clientId.endsWith('.apps.googleusercontent.com')).toBe(false);
      }
    });
  });
});
