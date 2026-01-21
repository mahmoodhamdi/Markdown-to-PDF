/**
 * SSO Types and Interfaces
 * Defines types for SSO/SAML configuration
 */

export type SSOProvider = 'saml' | 'oidc' | 'azure_ad' | 'okta' | 'google_workspace';

export type SSOStatus = 'active' | 'inactive' | 'pending' | 'error';

/**
 * SAML Configuration
 */
export interface SAMLConfig {
  entryPoint: string; // IdP SSO URL
  issuer: string; // SP Entity ID
  cert: string; // IdP Certificate (PEM format)
  callbackUrl: string; // ACS URL
  signatureAlgorithm?: 'sha256' | 'sha512';
  wantAssertionsSigned?: boolean;
  wantAuthnResponseSigned?: boolean;
  attributeMapping?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    groups?: string;
  };
}

/**
 * OIDC Configuration
 */
export interface OIDCConfig {
  clientId: string;
  clientSecret: string;
  issuer: string; // OIDC Issuer URL
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  jwksUrl?: string;
  scopes?: string[];
  attributeMapping?: {
    email?: string;
    name?: string;
    picture?: string;
    groups?: string;
  };
}

/**
 * Azure AD Configuration
 */
export interface AzureADConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  allowedGroups?: string[];
}

/**
 * Okta Configuration
 */
export interface OktaConfig {
  domain: string;
  clientId: string;
  clientSecret: string;
  authServerId?: string;
}

/**
 * Google Workspace Configuration
 */
export interface GoogleWorkspaceConfig {
  domain: string;
  clientId: string;
  clientSecret: string;
  allowedDomains?: string[];
}

/**
 * SSO Configuration Union Type
 */
export type SSOConfigData =
  | { provider: 'saml'; config: SAMLConfig }
  | { provider: 'oidc'; config: OIDCConfig }
  | { provider: 'azure_ad'; config: AzureADConfig }
  | { provider: 'okta'; config: OktaConfig }
  | { provider: 'google_workspace'; config: GoogleWorkspaceConfig };

/**
 * SSO Configuration Record
 */
export interface SSOConfiguration {
  id: string;
  organizationId: string;
  provider: SSOProvider;
  status: SSOStatus;
  config: SAMLConfig | OIDCConfig | AzureADConfig | OktaConfig | GoogleWorkspaceConfig;
  domain: string; // Email domain for auto-routing
  enforceSSO: boolean; // If true, users must use SSO
  allowBypass: boolean; // If true, admins can bypass SSO
  jitProvisioning: boolean; // Just-in-time user provisioning
  defaultRole: 'member' | 'admin';
  createdAt: string;
  updatedAt: string;
  lastTestedAt?: string;
  testResult?: {
    success: boolean;
    error?: string;
    testedBy?: string;
  };
}

/**
 * SSO Domain Mapping
 */
export interface SSODomainMapping {
  domain: string;
  organizationId: string;
  ssoConfigId: string;
  verified: boolean;
  verificationToken?: string;
  verificationMethod?: 'dns' | 'email';
  createdAt: string;
}

/**
 * SSO Login Session
 */
export interface SSOLoginSession {
  id: string;
  userId: string;
  organizationId: string;
  ssoConfigId: string;
  provider: SSOProvider;
  idpSessionId?: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * SSO Audit Log Entry
 */
export interface SSOAuditLog {
  id: string;
  organizationId: string;
  action:
    | 'login'
    | 'logout'
    | 'config_created'
    | 'config_updated'
    | 'config_deleted'
    | 'test_success'
    | 'test_failure';
  userId?: string;
  userEmail?: string;
  ssoConfigId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * SSO Test Request
 */
export interface SSOTestRequest {
  provider: SSOProvider;
  config: SAMLConfig | OIDCConfig | AzureADConfig | OktaConfig | GoogleWorkspaceConfig;
}

/**
 * SSO Test Result
 */
export interface SSOTestResult {
  success: boolean;
  provider: SSOProvider;
  message: string;
  details?: {
    metadataValid?: boolean;
    certificateValid?: boolean;
    certificateExpiry?: string;
    connectionSuccessful?: boolean;
    attributesReceived?: string[];
  };
  error?: string;
}

/**
 * SSO SAML Metadata
 */
export interface SAMLMetadata {
  entityId: string;
  acsUrl: string;
  sloUrl?: string;
  certificate?: string;
  metadataXml: string;
}
