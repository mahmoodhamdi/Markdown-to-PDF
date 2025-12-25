/**
 * Password Reset Email Template
 * Sent when a user requests to reset their password
 */

import { baseStyles, wrapInBaseTemplate } from './base';
import { getBaseUrl } from '../config';

interface PasswordResetEmailParams {
  name: string;
  email: string;
  token: string;
  expiresInMinutes?: number;
}

export function getPasswordResetEmail(params: PasswordResetEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, email, token, expiresInMinutes = 60 } = params;
  const displayName = name || email.split('@')[0];
  const baseUrl = getBaseUrl();
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

  const content = `
    <h1 style="${baseStyles.heading}">Reset Your Password</h1>

    <p style="${baseStyles.paragraph}">
      Hello ${displayName},
    </p>

    <p style="${baseStyles.paragraph}">
      We received a request to reset the password for your Markdown to PDF account.
    </p>

    <p style="${baseStyles.paragraph}">
      Click the button below to create a new password:
    </p>

    <div style="text-align: center;">
      <a href="${resetUrl}" style="${baseStyles.button}">
        Reset Password
      </a>
    </div>

    <p style="${baseStyles.paragraph}; ${baseStyles.muted}">
      This link will expire in ${expiresInMinutes} minutes.
    </p>

    <div style="${baseStyles.divider}"></div>

    <p style="${baseStyles.paragraph}">
      If you didn't request a password reset, you can safely ignore this email.
      Your password will remain unchanged.
    </p>

    <p style="${baseStyles.paragraph}; ${baseStyles.muted}">
      If the button above doesn't work, copy and paste this link into your browser:
    </p>

    <p style="${baseStyles.muted}; word-break: break-all;">
      <a href="${resetUrl}" style="${baseStyles.link}">${resetUrl}</a>
    </p>
  `;

  const html = wrapInBaseTemplate(content);

  const text = `
Reset Your Password

Hello ${displayName},

We received a request to reset the password for your Markdown to PDF account.

Click the link below to create a new password:
${resetUrl}

This link will expire in ${expiresInMinutes} minutes.

If you didn't request a password reset, you can safely ignore this email.
Your password will remain unchanged.

Best regards,
The Markdown to PDF Team
  `.trim();

  return {
    subject: 'Reset your password - Markdown to PDF',
    html,
    text,
  };
}
