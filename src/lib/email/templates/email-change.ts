/**
 * Email Change Verification Template
 * Sent when a user requests to change their email address
 */

import { baseStyles, wrapInBaseTemplate } from './base';
import { getBaseUrl } from '../config';

interface EmailChangeEmailParams {
  name: string;
  oldEmail: string;
  newEmail: string;
  token: string;
  expiresInMinutes?: number;
}

export function getEmailChangeEmail(params: EmailChangeEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, oldEmail, newEmail, token, expiresInMinutes = 60 } = params;
  const displayName = name || oldEmail.split('@')[0];
  const baseUrl = getBaseUrl();
  const verifyUrl = `${baseUrl}/auth/verify-email-change?token=${token}`;

  const content = `
    <h1 style="${baseStyles.heading}">Confirm Your Email Change</h1>

    <p style="${baseStyles.paragraph}">
      Hello ${displayName},
    </p>

    <p style="${baseStyles.paragraph}">
      We received a request to change the email address associated with your Markdown to PDF account.
    </p>

    <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="${baseStyles.paragraph}; margin: 0 0 8px 0;">
        <strong>Current email:</strong> ${oldEmail}
      </p>
      <p style="${baseStyles.paragraph}; margin: 0;">
        <strong>New email:</strong> ${newEmail}
      </p>
    </div>

    <p style="${baseStyles.paragraph}">
      Click the button below to confirm this change:
    </p>

    <div style="text-align: center;">
      <a href="${verifyUrl}" style="${baseStyles.button}">
        Confirm Email Change
      </a>
    </div>

    <p style="${baseStyles.paragraph}; ${baseStyles.muted}">
      This link will expire in ${expiresInMinutes} minutes.
    </p>

    <div style="${baseStyles.divider}"></div>

    <p style="${baseStyles.paragraph}">
      <strong>Important:</strong> If you did not request this change, please secure your account immediately by
      <a href="${baseUrl}/auth/forgot-password" style="${baseStyles.link}">resetting your password</a>.
    </p>

    <p style="${baseStyles.paragraph}; ${baseStyles.muted}">
      If the button above doesn't work, copy and paste this link into your browser:
    </p>

    <p style="${baseStyles.muted}; word-break: break-all;">
      <a href="${verifyUrl}" style="${baseStyles.link}">${verifyUrl}</a>
    </p>
  `;

  const html = wrapInBaseTemplate(content);

  const text = `
Confirm Your Email Change

Hello ${displayName},

We received a request to change the email address associated with your Markdown to PDF account.

Current email: ${oldEmail}
New email: ${newEmail}

Click the link below to confirm this change:
${verifyUrl}

This link will expire in ${expiresInMinutes} minutes.

Important: If you did not request this change, please secure your account immediately by resetting your password at ${baseUrl}/auth/forgot-password

Best regards,
The Markdown to PDF Team
  `.trim();

  return {
    subject: 'Confirm your email change - Markdown to PDF',
    html,
    text,
  };
}
