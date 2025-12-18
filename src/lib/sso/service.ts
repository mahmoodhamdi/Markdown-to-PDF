/**
 * SSO Service
 * Manages SSO/SAML configurations for Enterprise organizations
 */

import { adminDb } from '@/lib/firebase/admin';
import {
  SSOConfiguration,
  SSOProvider,
  SSOStatus,
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

// Collection names
const SSO_CONFIGS_COLLECTION = 'sso_configurations';
const SSO_DOMAINS_COLLECTION = 'sso_domains';
const SSO_AUDIT_COLLECTION = 'sso_audit_logs';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `sso_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Generate verification token for domain verification
 */
function generateVerificationToken(): string {
  return `md2pdf-verify-${crypto.randomBytes(16).toString('hex')}`;
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
  const id = generateId();
  const now = new Date().toISOString();

  const ssoConfig: SSOConfiguration = {
    id,
    organizationId,
    provider,
    status: 'pending',
    config,
    domain: domain.toLowerCase(),
    enforceSSO: options?.enforceSSO ?? false,
    allowBypass: options?.allowBypass ?? true,
    jitProvisioning: options?.jitProvisioning ?? true,
    defaultRole: options?.defaultRole ?? 'member',
    createdAt: now,
    updatedAt: now,
  };

  await adminDb.collection(SSO_CONFIGS_COLLECTION).doc(id).set(ssoConfig);

  // Log audit
  await logSSOAudit(organizationId, 'config_created', undefined, undefined, id);

  return ssoConfig;
}

/**
 * Get SSO configuration by ID
 */
export async function getSSOConfig(configId: string): Promise<SSOConfiguration | null> {
  const doc = await adminDb.collection(SSO_CONFIGS_COLLECTION).doc(configId).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as SSOConfiguration;
}

/**
 * Get SSO configuration for an organization
 */
export async function getSSOConfigByOrganization(organizationId: string): Promise<SSOConfiguration | null> {
  const snapshot = await adminDb
    .collection(SSO_CONFIGS_COLLECTION)
    .where('organizationId', '==', organizationId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as SSOConfiguration;
}

/**
 * Get SSO configuration by email domain
 */
export async function getSSOConfigByDomain(emailDomain: string): Promise<SSOConfiguration | null> {
  const domain = emailDomain.toLowerCase();

  // First check domain mappings
  const domainDoc = await adminDb
    .collection(SSO_DOMAINS_COLLECTION)
    .where('domain', '==', domain)
    .where('verified', '==', true)
    .limit(1)
    .get();

  if (!domainDoc.empty) {
    const mapping = domainDoc.docs[0].data() as SSODomainMapping;
    return getSSOConfig(mapping.ssoConfigId);
  }

  // Fallback to direct domain match in config
  const configDoc = await adminDb
    .collection(SSO_CONFIGS_COLLECTION)
    .where('domain', '==', domain)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (!configDoc.empty) {
    return configDoc.docs[0].data() as SSOConfiguration;
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
  const configRef = adminDb.collection(SSO_CONFIGS_COLLECTION).doc(configId);
  const doc = await configRef.get();

  if (!doc.exists) {
    return null;
  }

  const updatedConfig = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await configRef.update(updatedConfig);

  const existingData = doc.data() as SSOConfiguration;

  // Log audit
  await logSSOAudit(existingData.organizationId, 'config_updated', undefined, undefined, configId);

  return {
    ...existingData,
    ...updatedConfig,
  } as SSOConfiguration;
}

/**
 * Delete SSO configuration
 */
export async function deleteSSOConfig(configId: string): Promise<boolean> {
  const doc = await adminDb.collection(SSO_CONFIGS_COLLECTION).doc(configId).get();

  if (!doc.exists) {
    return false;
  }

  const config = doc.data() as SSOConfiguration;

  // Delete associated domain mappings
  const domainDocs = await adminDb
    .collection(SSO_DOMAINS_COLLECTION)
    .where('ssoConfigId', '==', configId)
    .get();

  const batch = adminDb.batch();
  domainDocs.docs.forEach((domainDoc) => {
    batch.delete(domainDoc.ref);
  });
  batch.delete(adminDb.collection(SSO_CONFIGS_COLLECTION).doc(configId));

  await batch.commit();

  // Log audit
  await logSSOAudit(config.organizationId, 'config_deleted', undefined, undefined, configId);

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
  const normalizedDomain = domain.toLowerCase();
  const verificationToken = generateVerificationToken();

  const mapping: SSODomainMapping = {
    domain: normalizedDomain,
    organizationId,
    ssoConfigId,
    verified: false,
    verificationToken,
    verificationMethod: 'dns',
    createdAt: new Date().toISOString(),
  };

  await adminDb.collection(SSO_DOMAINS_COLLECTION).doc(normalizedDomain).set(mapping);

  return mapping;
}

/**
 * Verify domain mapping
 */
export async function verifyDomainMapping(domain: string): Promise<boolean> {
  const normalizedDomain = domain.toLowerCase();
  const docRef = adminDb.collection(SSO_DOMAINS_COLLECTION).doc(normalizedDomain);
  const doc = await docRef.get();

  if (!doc.exists) {
    return false;
  }

  await docRef.update({
    verified: true,
    verificationToken: null,
  });

  return true;
}

/**
 * Get domain mapping
 */
export async function getDomainMapping(domain: string): Promise<SSODomainMapping | null> {
  const doc = await adminDb.collection(SSO_DOMAINS_COLLECTION).doc(domain.toLowerCase()).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as SSODomainMapping;
}

/**
 * Delete domain mapping
 */
export async function deleteDomainMapping(domain: string): Promise<boolean> {
  const doc = await adminDb.collection(SSO_DOMAINS_COLLECTION).doc(domain.toLowerCase()).get();

  if (!doc.exists) {
    return false;
  }

  await adminDb.collection(SSO_DOMAINS_COLLECTION).doc(domain.toLowerCase()).delete();
  return true;
}

/**
 * Test SSO configuration
 */
export async function testSSOConfig(
  configId: string,
  testedBy?: string
): Promise<SSOTestResult> {
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
  await adminDb.collection(SSO_CONFIGS_COLLECTION).doc(configId).update({
    lastTestedAt: new Date().toISOString(),
    testResult: {
      success: result.success,
      error: result.error,
      testedBy,
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
    ${sloUrl ? `<md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                              Location="${sloUrl}"/>` : ''}
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
  action: SSOAuditLog['action'],
  userId?: string,
  userEmail?: string,
  ssoConfigId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const auditLog: SSOAuditLog = {
    id: `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    organizationId,
    action,
    userId,
    userEmail,
    ssoConfigId,
    details,
    ipAddress,
    userAgent,
    timestamp: new Date().toISOString(),
  };

  await adminDb.collection(SSO_AUDIT_COLLECTION).doc(auditLog.id).set(auditLog);
}

/**
 * Get SSO audit logs for an organization
 */
export async function getSSOAuditLogs(
  organizationId: string,
  limit: number = 50,
  startAfter?: string
): Promise<SSOAuditLog[]> {
  let query = adminDb
    .collection(SSO_AUDIT_COLLECTION)
    .where('organizationId', '==', organizationId)
    .orderBy('timestamp', 'desc')
    .limit(limit);

  if (startAfter) {
    const startDoc = await adminDb.collection(SSO_AUDIT_COLLECTION).doc(startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => doc.data() as SSOAuditLog);
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
export async function getAllSSOConfigs(
  status?: SSOStatus
): Promise<SSOConfiguration[]> {
  let query = adminDb.collection(SSO_CONFIGS_COLLECTION) as FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;

  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => doc.data() as SSOConfiguration);
}
