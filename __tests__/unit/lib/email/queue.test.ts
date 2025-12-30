/**
 * Email Queue Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock nodemailer before imports
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    }),
  },
}));

// Mock email config
vi.mock('@/lib/email/config', () => ({
  EMAIL_CONFIG: {
    host: 'smtp.test.com',
    port: 587,
    secure: false,
    auth: { user: 'test', pass: 'test' },
    from: 'noreply@test.com',
  },
  isEmailConfigured: vi.fn().mockReturnValue(true),
}));

describe('EmailQueue', () => {
  let emailQueue: typeof import('@/lib/email/queue').emailQueue;
  let sendEmailDirect: typeof import('@/lib/email/queue').sendEmailDirect;
  let nodemailer: typeof import('nodemailer');
  let isEmailConfigured: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Re-import to get fresh instances
    const queueModule = await import('@/lib/email/queue');
    emailQueue = queueModule.emailQueue;
    sendEmailDirect = queueModule.sendEmailDirect;
    nodemailer = (await import('nodemailer')).default;
    isEmailConfigured = (await import('@/lib/email/config')).isEmailConfigured as ReturnType<
      typeof vi.fn
    >;
  });

  afterEach(() => {
    emailQueue.clear();
    vi.useRealTimers();
  });

  describe('enqueue', () => {
    it('should add email to queue and return job id', () => {
      const jobId = emailQueue.enqueue({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(jobId).toMatch(/^email_\d+_[a-z0-9]+$/);
    });

    it('should increment queue count', () => {
      emailQueue.enqueue({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });

      const status = emailQueue.getStatus();
      expect(status.pending).toBe(1);
    });
  });

  describe('getStatus', () => {
    it('should return correct status with no jobs', () => {
      const status = emailQueue.getStatus();

      expect(status).toEqual({
        pending: 0,
        failed: 0,
        processing: false,
      });
    });

    it('should return pending count correctly', () => {
      emailQueue.enqueue({
        to: 'test1@example.com',
        subject: 'Test 1',
        html: '<p>1</p>',
        text: '1',
      });
      emailQueue.enqueue({
        to: 'test2@example.com',
        subject: 'Test 2',
        html: '<p>2</p>',
        text: '2',
      });

      const status = emailQueue.getStatus();
      expect(status.pending).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all jobs from queue', () => {
      emailQueue.enqueue({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });

      emailQueue.clear();
      const status = emailQueue.getStatus();

      expect(status.pending).toBe(0);
    });
  });

  describe('getFailedJobs', () => {
    it('should return empty array when no failed jobs', () => {
      const failed = emailQueue.getFailedJobs();
      expect(failed).toEqual([]);
    });
  });

  describe('retry', () => {
    it('should return false for non-existent job', () => {
      const result = emailQueue.retry('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('sendEmailDirect', () => {
    it('should send email when configured', async () => {
      await sendEmailDirect({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });

      const transporter = nodemailer.createTransport();
      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@test.com',
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });
    });

    it('should log when email not configured in development', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      vi.stubEnv('NODE_ENV', 'development');
      isEmailConfigured.mockReturnValue(false);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await sendEmailDirect({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEV] Would send email to test@example.com')
      );
      consoleSpy.mockRestore();
      vi.stubEnv('NODE_ENV', originalNodeEnv || 'test');
    });

    it('should not log when email not configured in production', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      vi.stubEnv('NODE_ENV', 'production');
      isEmailConfigured.mockReturnValue(false);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await sendEmailDirect({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
      vi.stubEnv('NODE_ENV', originalNodeEnv || 'test');
    });
  });
});
