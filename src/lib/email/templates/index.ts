/**
 * Email Templates Index
 * Export all email templates from a single entry point
 */

export { baseStyles, wrapInBaseTemplate, stripHtmlToText } from './base';
export { getWelcomeEmail } from './welcome';
export { getPasswordResetEmail } from './password-reset';
export { getEmailChangeEmail } from './email-change';
export { getSubscriptionConfirmationEmail } from './subscription-confirmation';
export { getSubscriptionCanceledEmail } from './subscription-canceled';
export { getTeamInvitationEmail } from './team-invitation';
export { getEmailVerificationEmail } from './email-verification';
