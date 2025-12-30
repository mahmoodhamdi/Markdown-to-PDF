/**
 * Database Models Index
 * Export all Mongoose models from a single entry point
 */

export { User, type IUser } from './User';
export { Team, TeamMemberLookup, type ITeam, type ITeamMember, type ITeamMemberLookup, type ITeamSettings, type TeamRole } from './Team';
export { UserFile, StorageQuota, type IUserFile, type IStorageQuota } from './UserFile';
export { UsageEvent, DailyUsage, type IUsageEvent, type IDailyUsage, type EventType } from './Usage';
export {
  SSOConfiguration,
  SSODomainMapping,
  SSOAuditLog,
  type ISSOConfiguration,
  type ISSODomainMapping,
  type ISSOAuditLog,
  type SSOProvider,
  type SSOStatus,
  type SSOAuditAction,
} from './SSO';
export {
  RegionalSubscription,
  createRegionalSubscription,
  updateSubscriptionFromWebhook,
  expireOverdueSubscriptions,
  type IRegionalSubscription,
  type RegionalGateway,
  type SubscriptionStatus,
  type BillingInterval,
} from './RegionalSubscription';
export {
  PasswordResetToken,
  generateResetToken,
  hashToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  markTokenAsUsed,
  cleanupExpiredTokens,
  countRecentResetRequests,
  type IPasswordResetToken,
} from './PasswordResetToken';
export {
  EmailChangeToken,
  type IEmailChangeToken,
} from './EmailChangeToken';
export {
  EmailVerificationToken,
  generateVerificationToken,
  hashVerificationToken,
  createEmailVerificationToken,
  verifyEmailVerificationToken,
  markVerificationTokenAsUsed,
  hasPendingVerification,
  countRecentVerificationRequests,
  type IEmailVerificationToken,
} from './EmailVerificationToken';
export {
  TeamInvitation,
  type ITeamInvitation,
  type InvitationStatus,
} from './TeamInvitation';
export {
  TeamActivity,
  type ITeamActivity,
  type TeamActivityAction,
} from './TeamActivity';
export {
  Session,
  type ISession,
} from './Session';
export {
  Account,
  type IAccount,
  type OAuthProvider,
} from './Account';
export {
  LoginAttempt,
  recordFailedLogin,
  clearLoginAttempts,
  checkLoginBlocked,
  getRemainingAttempts,
  type ILoginAttempt,
} from './LoginAttempt';
export {
  ApiKey,
  hashApiKey,
  canCreateApiKey,
  getDefaultRateLimit,
  API_KEY_LIMITS,
  API_PERMISSIONS,
  type IApiKey,
  type IApiKeyDocument,
  type ApiPermission,
} from './ApiKey';
