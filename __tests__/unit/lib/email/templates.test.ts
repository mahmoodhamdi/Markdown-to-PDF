/**
 * Email Templates Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock email config
vi.mock('@/lib/email/config', () => ({
  getBaseUrl: vi.fn().mockReturnValue('https://test.example.com'),
}));

describe('Email Templates', () => {
  let templates: typeof import('@/lib/email/templates');

  beforeEach(async () => {
    vi.clearAllMocks();
    templates = await import('@/lib/email/templates');
  });

  describe('baseStyles', () => {
    it('should export baseStyles object with style strings', () => {
      expect(templates.baseStyles).toBeDefined();
      expect(typeof templates.baseStyles).toBe('object');
      expect(templates.baseStyles.container).toContain('font-family');
      expect(templates.baseStyles.button).toBeDefined();
      expect(templates.baseStyles.paragraph).toBeDefined();
    });
  });

  describe('wrapInBaseTemplate', () => {
    it('should wrap content in base template', () => {
      const result = templates.wrapInBaseTemplate('<p>Test content</p>');

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html lang="en">');
      expect(result).toContain('<p>Test content</p>');
      expect(result).toContain('</html>');
    });
  });

  describe('stripHtmlToText', () => {
    it('should convert HTML to plain text', () => {
      const html = '<h1>Title</h1><p>Paragraph with <strong>bold</strong> text.</p>';
      const text = templates.stripHtmlToText(html);

      expect(text).toContain('Title');
      expect(text).toContain('Paragraph');
      expect(text).toContain('bold');
      expect(text).not.toContain('<');
      expect(text).not.toContain('>');
    });

    it('should handle links', () => {
      const html = '<a href="https://example.com">Click here</a>';
      const text = templates.stripHtmlToText(html);

      expect(text).toContain('Click here');
    });

    it('should handle empty string', () => {
      const text = templates.stripHtmlToText('');
      expect(text).toBe('');
    });
  });

  describe('getWelcomeEmail', () => {
    it('should generate welcome email with name', () => {
      const result = templates.getWelcomeEmail({
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(result.subject).toBe('Welcome to Markdown to PDF!');
      expect(result.html).toContain('John Doe');
      expect(result.html).toContain('Welcome');
      expect(result.text).toBeDefined();
    });

    it('should handle missing name', () => {
      const result = templates.getWelcomeEmail({
        name: '',
        email: 'john@example.com',
      });

      expect(result.subject).toBe('Welcome to Markdown to PDF!');
      expect(result.html).toBeDefined();
    });
  });

  describe('getPasswordResetEmail', () => {
    it('should generate password reset email with token', () => {
      const result = templates.getPasswordResetEmail({
        name: 'John Doe',
        email: 'john@example.com',
        token: 'reset-token-123',
        expiresInMinutes: 60,
      });

      expect(result.subject).toBe('Reset your password - Markdown to PDF');
      expect(result.html).toContain('John Doe');
      expect(result.html).toContain('reset-token-123');
      expect(result.html).toContain('60');
      expect(result.text).toContain('reset-token-123');
    });

    it('should include reset link', () => {
      const result = templates.getPasswordResetEmail({
        name: 'Jane',
        email: 'jane@example.com',
        token: 'abc123',
        expiresInMinutes: 30,
      });

      expect(result.html).toContain('reset-password');
      expect(result.html).toContain('abc123');
    });
  });

  describe('getSubscriptionConfirmationEmail', () => {
    it('should generate subscription confirmation email', () => {
      const result = templates.getSubscriptionConfirmationEmail({
        name: 'John Doe',
        email: 'john@example.com',
        plan: 'pro',
        billing: 'monthly',
        amount: 5,
        currency: 'USD',
        gateway: 'stripe',
      });

      expect(result.subject).toContain('Pro');
      expect(result.subject).toContain('active');
      expect(result.html).toContain('John Doe');
      expect(result.html).toContain('Pro');
      expect(result.html).toContain('Monthly'); // Capitalized in template
      expect(result.text).toBeDefined();
    });

    it('should handle yearly billing', () => {
      const result = templates.getSubscriptionConfirmationEmail({
        name: 'Jane',
        email: 'jane@example.com',
        plan: 'team',
        billing: 'yearly',
      });

      expect(result.html).toContain('Team');
      expect(result.html).toContain('Yearly'); // Capitalized in template
    });

    it('should format amount with currency', () => {
      const result = templates.getSubscriptionConfirmationEmail({
        name: 'Test',
        email: 'test@example.com',
        plan: 'pro',
        billing: 'monthly',
        amount: 99.99,
        currency: 'EUR',
      });

      expect(result.html).toContain('EUR');
    });
  });

  describe('getSubscriptionCanceledEmail', () => {
    it('should generate subscription canceled email', () => {
      const result = templates.getSubscriptionCanceledEmail({
        name: 'John Doe',
        email: 'john@example.com',
        plan: 'pro',
        immediate: true,
      });

      expect(result.subject).toContain('subscription');
      expect(result.subject).toContain('canceled');
      expect(result.html).toContain('John Doe');
      expect(result.html).toContain('Pro');
      expect(result.text).toBeDefined();
    });

    it('should include end date when provided', () => {
      const endDate = new Date('2024-12-31');
      const result = templates.getSubscriptionCanceledEmail({
        name: 'Jane',
        email: 'jane@example.com',
        plan: 'team',
        endDate,
        immediate: false,
      });

      // Template uses toLocaleDateString which might format differently based on locale
      expect(result.html).toContain('2024');
    });
  });

  describe('getTeamInvitationEmail', () => {
    it('should generate team invitation email', () => {
      const result = templates.getTeamInvitationEmail({
        recipientEmail: 'invitee@example.com',
        teamName: 'Awesome Team',
        teamId: 'team-123',
        inviterName: 'John Doe',
        inviterEmail: 'john@example.com',
        role: 'member',
        invitationToken: 'invite-token-456',
      });

      expect(result.subject).toContain('Awesome Team');
      expect(result.html).toContain('Awesome Team');
      expect(result.html).toContain('John Doe');
      expect(result.html).toContain('member');
      expect(result.html).toContain('invite-token-456');
      expect(result.text).toBeDefined();
    });

    it('should handle admin role', () => {
      const result = templates.getTeamInvitationEmail({
        recipientEmail: 'invitee@example.com',
        teamName: 'Test Team',
        teamId: 'team-456',
        inviterName: 'Jane',
        inviterEmail: 'jane@example.com',
        role: 'admin',
        invitationToken: 'token-xyz',
      });

      expect(result.html).toContain('admin');
    });
  });

  describe('getEmailChangeEmail', () => {
    it('should generate email change verification email', () => {
      const result = templates.getEmailChangeEmail({
        name: 'John Doe',
        oldEmail: 'old@example.com',
        newEmail: 'new@example.com',
        token: 'change-token-123',
        expiresInMinutes: 60,
      });

      expect(result.subject).toBe('Confirm your email change - Markdown to PDF');
      expect(result.html).toContain('John Doe');
      expect(result.html).toContain('old@example.com');
      expect(result.html).toContain('new@example.com');
      expect(result.html).toContain('change-token-123');
      expect(result.html).toContain('60');
      expect(result.text).toBeDefined();
    });

    it('should include verification link', () => {
      const result = templates.getEmailChangeEmail({
        name: 'Jane',
        oldEmail: 'old@example.com',
        newEmail: 'new@example.com',
        token: 'abc123',
        expiresInMinutes: 30,
      });

      expect(result.html).toContain('verify-email-change');
      expect(result.html).toContain('abc123');
    });

    it('should include both old and new email in text version', () => {
      const result = templates.getEmailChangeEmail({
        name: 'Test User',
        oldEmail: 'current@example.com',
        newEmail: 'updated@example.com',
        token: 'token-xyz',
      });

      expect(result.text).toContain('current@example.com');
      expect(result.text).toContain('updated@example.com');
    });

    it('should use default expiry of 60 minutes', () => {
      const result = templates.getEmailChangeEmail({
        name: 'User',
        oldEmail: 'old@example.com',
        newEmail: 'new@example.com',
        token: 'token',
      });

      expect(result.html).toContain('60 minutes');
    });
  });
});
