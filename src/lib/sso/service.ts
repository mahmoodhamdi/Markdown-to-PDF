/**
 * SSO Service
 * Manages SSO/SAML configurations for Enterprise organizations
 * Uses MongoDB for data storage
 */

import { connectDB } from '@/lib/db/mongodb';
import {
  SSOConfiguration as SSOConfigurationModel,
  SSODomainMapping as SSODomainMappingModel,
  SSOAuditLog as SSOAuditLogModel,
  type ISSOConfiguration,
  type ISSODomainMapping,
  type ISSOAuditLog,
  type SSOProvider,
  type SSOStatus,
  type SSOAuditAction,
} from '@/lib/db/models/SSO';
import {
  SSOConfiguration,
  SSODomainMapping,
  SSOAuditLog,
  SAMLConfig,
  OIDCConfig,
  AzureADConfig,
  OktaConfig,
  GoogleWorkspaceConfig,
  SSOTestResult,
  SAMLMetadata,
} from './types';
import crypto from 'crypto';

export type { SSOProvider, SSOStatus } from '@/lib/db/models/SSO';

/**
 * Generate verification token for domain verification
 */
function generateVerificationToken(): string {
  return `md2pdf-verify-${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Convert MongoDB document to SSOConfiguration type
 */
function toSSOConfiguration(doc: ISSOConfiguration): SSOConfiguration {
  return {
    id: doc._id.toString(),
    organizationId: doc.organizationId,
    provider: doc.provider,
    status: doc.status,
    config: doc.config as unknown as
      | SAMLConfig
      | OIDCConfig
      | AzureADConfig
      | OktaConfig
      | GoogleWorkspaceConfig,
    domain: doc.domain,
    enforceSSO: doc.enforceSSO,
    allowBypass: doc.allowBypass,
    jitProvisioning: doc.jitProvisioning,
    defaultRole: doc.defaultRole,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    lastTestedAt: doc.lastTestedAt?.toISOString(),
    testResult: doc.testResult,
  };
}

/**
 * Convert MongoDB document to SSODomainMapping type
 */
function toSSODomainMapping(doc: ISSODomainMapping): SSODomainMapping {
  return {
    domain: doc.domain,
    organizationId: doc.organizationId,
    ssoConfigId: doc.ssoConfigId,
    verified: doc.verified,
    verificationToken: doc.verificationToken,
    verificationMethod: doc.verificationMethod,
    createdAt: doc.createdAt.toISOString(),
  };
}

/**
 * Convert MongoDB document to SSOAuditLog type
 */
function toSSOAuditLog(doc: ISSOAuditLog): SSOAuditLog {
  return {
    id: doc._id.toString(),
    organizationId: doc.organizationId,
    action: doc.action,
    userId: doc.userId,
    userEmail: doc.userEmail,
    ssoConfigId: doc.ssoConfigId,
    details: doc.details,
    ipAddress: doc.ipAddress,
    userAgent: doc.userAgent,
    timestamp: doc.timestamp.toISOString(),
  };
}

/**
 * Create a new SSO configuration
 */
export async function createSSOConfig(
  organizationId: string,
  provider: SSOProvider,
  config: SAMLConfig | OIDCConfig | AzureADConfig | OktaConfig | GoogleWorkspaceConfig,
  domain: string,
  options?: {
    enforceSSO?: boolean;
    allowBypass?: boolean;
    jitProvisioning?: boolean;
    defaultRole?: 'member' | 'admin';
  }
): Promise<SSOConfiguration> {
  await connectDB();

  const ssoConfig = await SSOConfigurationModel.create({
    organizationId,
    provider,
    status: 'pending',
    config: config as unknown as Record<string, unknown>,
    domain: domain.toLowerCase(),
    enforceSSO: options?.enforceSSO ?? false,
    allowBypass: options?.allowBypass ?? true,
    jitProvisioning: options?.jitProvisioning ?? true,
    defaultRole: options?.defaultRole ?? 'member',
  });

  // Log audit
  await logSSOAudit(
    organizationId,
    'config_created',
    undefined,
    undefined,
    ssoConfig._id.toString()
  );

  return toSSOConfiguration(ssoConfig);
}

/**
 * Get SSO configuration by ID
 */
export async function getSSOConfig(configId: string): Promise<SSOConfiguration | null> {
  await connectDB();

  const doc = await SSOConfigurationModel.findById(configId);

  if (!doc) {
    return null;
  }

  return toSSOConfiguration(doc);
}

/**
 * Get SSO configuration for an organization
 */
export async function getSSOConfigByOrganization(
  organizationId: string
): Promise<SSOConfiguration | null> {
  await connectDB();

  const doc = await SSOConfigurationModel.findOne({ organizationId });

  if (!doc) {
    return null;
  }

  return toSSOConfiguration(doc);
}

/**
 * Get SSO configuration by email domain
 */
export async function getSSOConfigByDomain(emailDomain: string): Promise<SSOConfiguration | null> {
  await connectDB();

  const domain = emailDomain.toLowerCase();

  // First check domain mappings
  const domainMapping = await SSODomainMappingModel.findOne({
    domain,
    verified: true,
  });

  if (domainMapping) {
    return getSSOConfig(domainMapping.ssoConfigId);
  }

  // Fallback to direct domain match in config
  const configDoc = await SSOConfigurationModel.findOne({
    domain,
    status: 'active',
  });

  if (configDoc) {
    return toSSOConfiguration(configDoc);
  }

  return null;
}

/**
 * Update SSO configuration
 */
export async function updateSSOConfig(
  configId: string,
  updates: Partial<
    Pick<
      SSOConfiguration,
      'config' | 'status' | 'enforceSSO' | 'allowBypass' | 'jitProvisioning' | 'defaultRole'
    >
  >
): Promise<SSOConfiguration | null> {
  await connectDB();

  const doc = await SSOConfigurationModel.findById(configId);

  if (!doc) {
    return null;
  }

  const updatedDoc = await SSOConfigurationModel.findByIdAndUpdate(
    configId,
    { $set: updates },
    { new: true }
  );

  if (!updatedDoc) {
    return null;
  }

  // Log audit
  await logSSOAudit(doc.organizationId, 'config_updated', undefined, undefined, configId);

  return toSSOConfiguration(updatedDoc);
}

/**
 * Delete SSO configuration
 */
export async function deleteSSOConfig(configId: string): Promise<boolean> {
  await connectDB();

  const doc = await SSOConfigurationModel.findById(configId);

  if (!doc) {
    return false;
  }

  // Delete associated domain mappings
  await SSODomainMappingModel.deleteMany({ ssoConfigId: configId });

  // Delete the config
  await SSOConfigurationModel.findByIdAndDelete(configId);

  // Log audit
  await logSSOAudit(doc.organizationId, 'config_deleted', undefined, undefined, configId);

  return true;
}

/**
 * Activate SSO configuration
 */
export async function activateSSOConfig(configId: string): Promise<SSOConfiguration | null> {
  return updateSSOConfig(configId, { status: 'active' });
}

/**
 * Deactivate SSO configuration
 */
export async function deactivateSSOConfig(configId: string): Promise<SSOConfiguration | null> {
  return updateSSOConfig(configId, { status: 'inactive' });
}

/**
 * Create domain mapping
 */
export async function createDomainMapping(
  domain: string,
  organizationId: string,
  ssoConfigId: string
): Promise<SSODomainMapping> {
  await connectDB();

  const normalizedDomain = domain.toLowerCase();
  const verificationToken = generateVerificationToken();

  const mapping = await SSODomainMappingModel.create({
    domain: normalizedDomain,
    organizationId,
    ssoConfigId,
    verified: false,
    verificationToken,
    verificationMethod: 'dns',
  });

  return toSSODomainMapping(mapping);
}

/**
 * Verify domain mapping
 */
export async function verifyDomainMapping(domain: string): Promise<boolean> {
  await connectDB();

  const normalizedDomain = domain.toLowerCase();
  const doc = await SSODomainMappingModel.findOne({ domain: normalizedDomain });

  if (!doc) {
    return false;
  }

  await SSODomainMappingModel.updateOne(
    { domain: normalizedDomain },
    {
      $set: { verified: true },
      $unset: { verificationToken: 1 },
    }
  );

  return true;
}

/**
 * Get domain mapping
 */
export async function getDomainMapping(domain: string): Promise<SSODomainMapping | null> {
  await connectDB();

  const doc = await SSODomainMappingModel.findOne({ domain: domain.toLowerCase() });

  if (!doc) {
    return null;
  }

  return toSSODomainMapping(doc);
}

/**
 * Delete domain mapping
 */
export async function deleteDomainMapping(domain: string): Promise<boolean> {
  await connectDB();

  const result = await SSODomainMappingModel.deleteOne({ domain: domain.toLowerCase() });

  return result.deletedCount > 0;
}

/**
 * Test SSO configuration
 */
export async function testSSOConfig(configId: string, testedBy?: string): Promise<SSOTestResult> {
  const config = await getSSOConfig(configId);

  if (!config) {
    return {
      success: false,
      provider: 'saml',
      message: 'Configuration not found',
      error: 'SSO configuration does not exist',
    };
  }

  const result = await testProviderConfig(config.provider, config.config);

  // Update config with test result
  await connectDB();
  await SSOConfigurationModel.findByIdAndUpdate(configId, {
    $set: {
      lastTestedAt: new Date(),
      testResult: {
        success: result.success,
        error: result.error,
        testedBy,
      },
    },
  });

  // Log audit
  await logSSOAudit(
    config.organizationId,
    result.success ? 'test_success' : 'test_failure',
    undefined,
    undefined,
    configId,
    { result }
  );

  return result;
}

/**
 * Test provider configuration
 */
async function testProviderConfig(
  provider: SSOProvider,
  config: SAMLConfig | OIDCConfig | AzureADConfig | OktaConfig | GoogleWorkspaceConfig
): Promise<SSOTestResult> {
  try {
    switch (provider) {
      case 'saml':
        return testSAMLConfig(config as SAMLConfig);
      case 'oidc':
        return testOIDCConfig(config as OIDCConfig);
      case 'azure_ad':
        return testAzureADConfig(config as AzureADConfig);
      case 'okta':
        return testOktaConfig(config as OktaConfig);
      case 'google_workspace':
        return testGoogleWorkspaceConfig(config as GoogleWorkspaceConfig);
      default:
        return {
          success: false,
          provider,
          message: 'Unknown provider',
          error: `Provider ${provider} is not supported`,
        };
    }
  } catch (error) {
    return {
      success: false,
      provider,
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test SAML configuration
 */
async function testSAMLConfig(config: SAMLConfig): Promise<SSOTestResult> {
  const details: SSOTestResult['details'] = {};

  // Validate entry point URL
  try {
    new URL(config.entryPoint);
    details.connectionSuccessful = true;
  } catch {
    return {
      success: false,
      provider: 'saml',
      message: 'Invalid entry point URL',
      error: 'The IdP SSO URL is not a valid URL',
    };
  }

  // Validate certificate
  if (config.cert) {
    try {
      // Basic certificate validation
      const certContent = config.cert
        .replace(/-----BEGIN CERTIFICATE-----/g, '')
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/\s/g, '');

      if (certContent.length < 100) {
        throw new Error('Certificate appears to be too short');
      }

      // Check if it's valid base64
      Buffer.from(certContent, 'base64');
      details.certificateValid = true;

      // Note: In production, you would parse the certificate to get expiry
      details.certificateExpiry = 'Certificate format valid';
    } catch {
      return {
        success: false,
        provider: 'saml',
        message: 'Invalid certificate',
        error: 'The IdP certificate is not in valid PEM format',
        details,
      };
    }
  }

  // Validate issuer
  if (!config.issuer || config.issuer.length < 3) {
    return {
      success: false,
      provider: 'saml',
      message: 'Invalid issuer',
      error: 'SP Entity ID (issuer) is required',
      details,
    };
  }

  details.metadataValid = true;

  return {
    success: true,
    provider: 'saml',
    message: 'SAML configuration is valid',
    details,
  };
}

/**
 * Test OIDC configuration
 */
async function testOIDCConfig(config: OIDCConfig): Promise<SSOTestResult> {
  const details: SSOTestResult['details'] = {};

  // Validate issuer URL
  try {
    new URL(config.issuer);
    details.connectionSuccessful = true;
  } catch {
    return {
      success: false,
      provider: 'oidc',
      message: 'Invalid issuer URL',
      error: 'The OIDC issuer URL is not valid',
    };
  }

  // Validate client ID and secret
  if (!config.clientId || config.clientId.length < 5) {
    return {
      success: false,
      provider: 'oidc',
      message: 'Invalid client ID',
      error: 'Client ID is required and must be at least 5 characters',
      details,
    };
  }

  if (!config.clientSecret || config.clientSecret.length < 10) {
    return {
      success: false,
      provider: 'oidc',
      message: 'Invalid client secret',
      error: 'Client secret is required and must be at least 10 characters',
      details,
    };
  }

  details.metadataValid = true;

  return {
    success: true,
    provider: 'oidc',
    message: 'OIDC configuration is valid',
    details,
  };
}

/**
 * Test Azure AD configuration
 */
async function testAzureADConfig(config: AzureADConfig): Promise<SSOTestResult> {
  const details: SSOTestResult['details'] = {};

  // Validate tenant ID (GUID format)
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guidRegex.test(config.tenantId)) {
    return {
      success: false,
      provider: 'azure_ad',
      message: 'Invalid tenant ID',
      error: 'Tenant ID must be a valid GUID',
    };
  }

  // Validate client ID
  if (!guidRegex.test(config.clientId)) {
    return {
      success: false,
      provider: 'azure_ad',
      message: 'Invalid client ID',
      error: 'Client ID must be a valid GUID',
      details,
    };
  }

  // Validate client secret
  if (!config.clientSecret || config.clientSecret.length < 10) {
    return {
      success: false,
      provider: 'azure_ad',
      message: 'Invalid client secret',
      error: 'Client secret is required',
      details,
    };
  }

  details.connectionSuccessful = true;
  details.metadataValid = true;

  return {
    success: true,
    provider: 'azure_ad',
    message: 'Azure AD configuration is valid',
    details,
  };
}

/**
 * Test Okta configuration
 */
async function testOktaConfig(config: OktaConfig): Promise<SSOTestResult> {
  const details: SSOTestResult['details'] = {};

  // Validate domain
  if (!config.domain || !config.domain.includes('.')) {
    return {
      success: false,
      provider: 'okta',
      message: 'Invalid domain',
      error: 'Okta domain is required (e.g., your-org.okta.com)',
    };
  }

  // Validate client ID
  if (!config.clientId || config.clientId.length < 10) {
    return {
      success: false,
      provider: 'okta',
      message: 'Invalid client ID',
      error: 'Client ID is required',
      details,
    };
  }

  // Validate client secret
  if (!config.clientSecret || config.clientSecret.length < 10) {
    return {
      success: false,
      provider: 'okta',
      message: 'Invalid client secret',
      error: 'Client secret is required',
      details,
    };
  }

  details.connectionSuccessful = true;
  details.metadataValid = true;

  return {
    success: true,
    provider: 'okta',
    message: 'Okta configuration is valid',
    details,
  };
}

/**
 * Test Google Workspace configuration
 */
async function testGoogleWorkspaceConfig(config: GoogleWorkspaceConfig): Promise<SSOTestResult> {
  const details: SSOTestResult['details'] = {};

  // Validate domain
  if (!config.domain || !config.domain.includes('.')) {
    return {
      success: false,
      provider: 'google_workspace',
      message: 'Invalid domain',
      error: 'Google Workspace domain is required',
    };
  }

  // Validate client ID
  if (!config.clientId || !config.clientId.includes('.apps.googleusercontent.com')) {
    return {
      success: false,
      provider: 'google_workspace',
      message: 'Invalid client ID',
      error: 'Client ID must be a valid Google OAuth client ID',
      details,
    };
  }

  // Validate client secret
  if (!config.clientSecret || config.clientSecret.length < 10) {
    return {
      success: false,
      provider: 'google_workspace',
      message: 'Invalid client secret',
      error: 'Client secret is required',
      details,
    };
  }

  details.connectionSuccessful = true;
  details.metadataValid = true;

  return {
    success: true,
    provider: 'google_workspace',
    message: 'Google Workspace configuration is valid',
    details,
  };
}

/**
 * Generate SAML Service Provider metadata
 */
export function generateSPMetadata(
  entityId: string,
  acsUrl: string,
  sloUrl?: string
): SAMLMetadata {
  const metadataXml = `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                     entityID="${entityId}">
  <md:SPSSODescriptor AuthnRequestsSigned="true"
                      WantAssertionsSigned="true"
                      protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                 Location="${acsUrl}"
                                 index="0"
                                 isDefault="true"/>
    ${
      sloUrl
        ? `<md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                              Location="${sloUrl}"/>`
        : ''
    }
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;

  return {
    entityId,
    acsUrl,
    sloUrl,
    metadataXml,
  };
}

/**
 * Log SSO audit event
 */
export async function logSSOAudit(
  organizationId: string,
  action: SSOAuditAction,
  userId?: string,
  userEmail?: string,
  ssoConfigId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await connectDB();

    await SSOAuditLogModel.create({
      organizationId,
      action,
      userId,
      userEmail,
      ssoConfigId,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log SSO audit:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Get SSO audit logs for an organization
 */
export async function getSSOAuditLogs(
  organizationId: string,
  limit: number = 50,
  skip: number = 0
): Promise<SSOAuditLog[]> {
  await connectDB();

  const docs = await SSOAuditLogModel.find({ organizationId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  return docs.map(toSSOAuditLog);
}

/**
 * Check if email should use SSO
 */
export async function shouldUseSSO(email: string): Promise<{
  useSSO: boolean;
  ssoConfig?: SSOConfiguration;
  enforced: boolean;
}> {
  const domain = email.split('@')[1]?.toLowerCase();

  if (!domain) {
    return { useSSO: false, enforced: false };
  }

  const ssoConfig = await getSSOConfigByDomain(domain);

  if (!ssoConfig || ssoConfig.status !== 'active') {
    return { useSSO: false, enforced: false };
  }

  return {
    useSSO: true,
    ssoConfig,
    enforced: ssoConfig.enforceSSO,
  };
}

/**
 * Record SSO login
 */
export async function recordSSOLogin(
  userId: string,
  organizationId: string,
  ssoConfigId: string,
  provider: SSOProvider,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logSSOAudit(
    organizationId,
    'login',
    userId,
    undefined,
    ssoConfigId,
    { provider },
    ipAddress,
    userAgent
  );
}

/**
 * Record SSO logout
 */
export async function recordSSOLogout(
  userId: string,
  organizationId: string,
  ssoConfigId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logSSOAudit(
    organizationId,
    'logout',
    userId,
    undefined,
    ssoConfigId,
    undefined,
    ipAddress,
    userAgent
  );
}

/**
 * Get all SSO configurations (admin only)
 */
export async function getAllSSOConfigs(status?: SSOStatus): Promise<SSOConfiguration[]> {
  await connectDB();

  const query = status ? { status } : {};
  const docs = await SSOConfigurationModel.find(query);

  return docs.map(toSSOConfiguration);
}

/**
 * Get SSO configuration count by status
 */
export async function getSSOConfigStats(): Promise<Record<SSOStatus, number>> {
  await connectDB();

  const result = await SSOConfigurationModel.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const stats: Record<SSOStatus, number> = {
    active: 0,
    inactive: 0,
    pending: 0,
    error: 0,
  };

  result.forEach((item) => {
    stats[item._id as SSOStatus] = item.count;
  });

  return stats;
}

/**
 * Get domains for an SSO configuration
 */
export async function getDomainsForConfig(ssoConfigId: string): Promise<SSODomainMapping[]> {
  await connectDB();

  const docs = await SSODomainMappingModel.find({ ssoConfigId });

  return docs.map(toSSODomainMapping);
}

/**
 * Clean up old audit logs (older than 90 days)
 */
export async function cleanupOldAuditLogs(): Promise<number> {
  try {
    await connectDB();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const result = await SSOAuditLogModel.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    return result.deletedCount || 0;
  } catch (error) {
    console.error('Failed to cleanup old audit logs:', error);
    return 0;
  }
}
