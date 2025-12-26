/**
 * Email Service
 * High-level service for sending emails using templates
 */

import { emailQueue, sendEmailDirect } from './queue';
import { isEmailConfigured } from './config';
import {
  getWelcomeEmail,
  getPasswordResetEmail,
  getEmailChangeEmail,
  getSubscriptionConfirmationEmail,
  getSubscriptionCanceledEmail,
  getTeamInvitationEmail,
  getEmailVerificationEmail,
  getAccountDeletionEmail,
} from './templates';
import { PlanType } from '@/lib/plans/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  immediate?: boolean; // Send immediately without queue
}

export interface UserEmailParams {
  email: string;
  name?: string;
}

/**
 * Email Service
 * Provides high-level methods for sending different types of emails
 */
export const emailService = {
  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return isEmailConfigured();
  },

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<string | void> {
    if (options.immediate) {
      await sendEmailDirect({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      return;
    }

    return emailQueue.enqueue({
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  },

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(user: UserEmailParams): Promise<string> {
    const { subject, html, text } = getWelcomeEmail({
      name: user.name || '',
      email: user.email,
    });

    return emailQueue.enqueue({
      to: user.email,
      subject,
      html,
      text,
    });
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    user: UserEmailParams,
    token: string,
    expiresInMinutes = 60
  ): Promise<string> {
    const { subject, html, text } = getPasswordResetEmail({
      name: user.name || '',
      email: user.email,
      token,
      expiresInMinutes,
    });

    // Send password reset emails immediately for security
    await sendEmailDirect({
      to: user.email,
      subject,
      html,
      text,
    });

    return 'sent';
  },

  /**
   * Send email verification email (for new registrations)
   */
  async sendEmailVerification(
    user: UserEmailParams,
    token: string,
    expiresInHours = 24
  ): Promise<string> {
    const { subject, html, text } = getEmailVerificationEmail({
      name: user.name || '',
      email: user.email,
      token,
      expiresInHours,
    });

    // Send verification emails immediately
    await sendEmailDirect({
      to: user.email,
      subject,
      html,
      text,
    });

    return 'sent';
  },

  /**
   * Send email change verification email
   */
  async sendEmailChangeVerification(
    user: UserEmailParams,
    newEmail: string,
    token: string,
    expiresInMinutes = 60
  ): Promise<string> {
    const { subject, html, text } = getEmailChangeEmail({
      name: user.name || '',
      oldEmail: user.email,
      newEmail,
      token,
      expiresInMinutes,
    });

    // Send email change verification to the NEW email address
    await sendEmailDirect({
      to: newEmail,
      subject,
      html,
      text,
    });

    return 'sent';
  },

  /**
   * Send subscription confirmation email
   */
  async sendSubscriptionConfirmation(
    user: UserEmailParams,
    options: {
      plan: PlanType;
      billing: 'monthly' | 'yearly';
      amount?: number;
      currency?: string;
      gateway?: string;
    }
  ): Promise<string> {
    const { subject, html, text } = getSubscriptionConfirmationEmail({
      name: user.name || '',
      email: user.email,
      plan: options.plan,
      billing: options.billing,
      amount: options.amount,
      currency: options.currency,
      gateway: options.gateway,
    });

    return emailQueue.enqueue({
      to: user.email,
      subject,
      html,
      text,
    });
  },

  /**
   * Send subscription canceled email
   */
  async sendSubscriptionCanceled(
    user: UserEmailParams,
    options: {
      plan: PlanType;
      endDate?: Date;
      immediate?: boolean;
    }
  ): Promise<string> {
    const { subject, html, text } = getSubscriptionCanceledEmail({
      name: user.name || '',
      email: user.email,
      plan: options.plan,
      endDate: options.endDate,
      immediate: options.immediate,
    });

    return emailQueue.enqueue({
      to: user.email,
      subject,
      html,
      text,
    });
  },

  /**
   * Send team invitation email
   */
  async sendTeamInvitation(options: {
    recipientEmail: string;
    teamName: string;
    teamId: string;
    inviterName: string;
    inviterEmail: string;
    role: 'admin' | 'member';
    invitationToken: string;
  }): Promise<string> {
    const { subject, html, text } = getTeamInvitationEmail(options);

    return emailQueue.enqueue({
      to: options.recipientEmail,
      subject,
      html,
      text,
    });
  },

  /**
   * Send account deletion confirmation email
   */
  async sendAccountDeletion(user: UserEmailParams): Promise<string> {
    const { subject, html, text } = getAccountDeletionEmail({
      name: user.name || '',
      email: user.email,
    });

    // Send immediately since account is being deleted
    await sendEmailDirect({
      to: user.email,
      subject,
      html,
      text,
    });

    return 'sent';
  },

  /**
   * Get queue status
   */
  getQueueStatus() {
    return emailQueue.getStatus();
  },

  /**
   * Get failed emails
   */
  getFailedEmails() {
    return emailQueue.getFailedJobs();
  },

  /**
   * Retry a failed email
   */
  retryEmail(jobId: string): boolean {
    return emailQueue.retry(jobId);
  },

  /**
   * Clear email queue
   */
  clearQueue(): void {
    emailQueue.clear();
  },
};

// Default export
export default emailService;

// Re-export types
export type { EmailJob } from './queue';
