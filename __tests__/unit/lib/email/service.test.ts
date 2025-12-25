/**
 * Email Service Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/email/queue', () => ({
  emailQueue: {
    enqueue: vi.fn().mockReturnValue('test-job-id'),
    getStatus: vi.fn().mockReturnValue({ pending: 0, failed: 0, processing: false }),
    getFailedJobs: vi.fn().mockReturnValue([]),
    retry: vi.fn().mockReturnValue(true),
    clear: vi.fn(),
  },
  sendEmailDirect: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/email/config', () => ({
  isEmailConfigured: vi.fn().mockReturnValue(true),
}));

vi.mock('@/lib/email/templates', () => ({
  getWelcomeEmail: vi.fn().mockReturnValue({
    subject: 'Welcome!',
    html: '<p>Welcome</p>',
    text: 'Welcome',
  }),
  getPasswordResetEmail: vi.fn().mockReturnValue({
    subject: 'Password Reset',
    html: '<p>Reset</p>',
    text: 'Reset',
  }),
  getSubscriptionConfirmationEmail: vi.fn().mockReturnValue({
    subject: 'Subscription Confirmed',
    html: '<p>Confirmed</p>',
    text: 'Confirmed',
  }),
  getSubscriptionCanceledEmail: vi.fn().mockReturnValue({
    subject: 'Subscription Canceled',
    html: '<p>Canceled</p>',
    text: 'Canceled',
  }),
  getTeamInvitationEmail: vi.fn().mockReturnValue({
    subject: 'Team Invitation',
    html: '<p>Invitation</p>',
    text: 'Invitation',
  }),
}));

describe('EmailService', () => {
  let emailService: typeof import('@/lib/email/service').emailService;
  let emailQueue: typeof import('@/lib/email/queue').emailQueue;
  let sendEmailDirect: typeof import('@/lib/email/queue').sendEmailDirect;
  let isEmailConfigured: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const serviceModule = await import('@/lib/email/service');
    emailService = serviceModule.emailService;
    const queueModule = await import('@/lib/email/queue');
    emailQueue = queueModule.emailQueue;
    sendEmailDirect = queueModule.sendEmailDirect as ReturnType<typeof vi.fn>;
    isEmailConfigured = (await import('@/lib/email/config')).isEmailConfigured as ReturnType<
      typeof vi.fn
    >;
  });

  describe('isConfigured', () => {
    it('should return true when email is configured', () => {
      isEmailConfigured.mockReturnValue(true);
      expect(emailService.isConfigured()).toBe(true);
    });

    it('should return false when email is not configured', () => {
      isEmailConfigured.mockReturnValue(false);
      expect(emailService.isConfigured()).toBe(false);
    });
  });

  describe('sendEmail', () => {
    it('should queue email by default', async () => {
      const jobId = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(emailQueue.enqueue).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });
      expect(jobId).toBe('test-job-id');
    });

    it('should send immediately when immediate flag is set', async () => {
      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
        immediate: true,
      });

      expect(sendEmailDirect).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });
      expect(emailQueue.enqueue).not.toHaveBeenCalled();
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should queue welcome email', async () => {
      const jobId = await emailService.sendWelcomeEmail({
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(emailQueue.enqueue).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Welcome!',
        html: '<p>Welcome</p>',
        text: 'Welcome',
      });
      expect(jobId).toBe('test-job-id');
    });

    it('should handle missing name', async () => {
      await emailService.sendWelcomeEmail({
        email: 'test@example.com',
      });

      expect(emailQueue.enqueue).toHaveBeenCalled();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email immediately', async () => {
      await emailService.sendPasswordResetEmail(
        { email: 'test@example.com', name: 'Test User' },
        'reset-token-123',
        60
      );

      expect(sendEmailDirect).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Password Reset',
        html: '<p>Reset</p>',
        text: 'Reset',
      });
    });
  });

  describe('sendSubscriptionConfirmation', () => {
    it('should queue subscription confirmation email', async () => {
      await emailService.sendSubscriptionConfirmation(
        { email: 'test@example.com', name: 'Test User' },
        {
          plan: 'pro',
          billing: 'monthly',
          amount: 5,
          currency: 'USD',
          gateway: 'stripe',
        }
      );

      expect(emailQueue.enqueue).toHaveBeenCalled();
    });
  });

  describe('sendSubscriptionCanceled', () => {
    it('should queue subscription canceled email', async () => {
      await emailService.sendSubscriptionCanceled(
        { email: 'test@example.com', name: 'Test User' },
        { plan: 'pro', immediate: true }
      );

      expect(emailQueue.enqueue).toHaveBeenCalled();
    });
  });

  describe('sendTeamInvitation', () => {
    it('should queue team invitation email', async () => {
      await emailService.sendTeamInvitation({
        recipientEmail: 'invitee@example.com',
        teamName: 'Test Team',
        teamId: 'team-123',
        inviterName: 'John Doe',
        inviterEmail: 'john@example.com',
        role: 'member',
        invitationToken: 'invite-token-123',
      });

      expect(emailQueue.enqueue).toHaveBeenCalledWith({
        to: 'invitee@example.com',
        subject: 'Team Invitation',
        html: '<p>Invitation</p>',
        text: 'Invitation',
      });
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status', () => {
      const status = emailService.getQueueStatus();
      expect(emailQueue.getStatus).toHaveBeenCalled();
      expect(status).toEqual({ pending: 0, failed: 0, processing: false });
    });
  });

  describe('getFailedEmails', () => {
    it('should return failed emails', () => {
      const failed = emailService.getFailedEmails();
      expect(emailQueue.getFailedJobs).toHaveBeenCalled();
      expect(failed).toEqual([]);
    });
  });

  describe('retryEmail', () => {
    it('should retry failed email', () => {
      const result = emailService.retryEmail('job-123');
      expect(emailQueue.retry).toHaveBeenCalledWith('job-123');
      expect(result).toBe(true);
    });
  });

  describe('clearQueue', () => {
    it('should clear the queue', () => {
      emailService.clearQueue();
      expect(emailQueue.clear).toHaveBeenCalled();
    });
  });
});
