/**
 * Email Verification Template
 * Sent when a user registers to verify their email address
 */

import { baseStyles, wrapInBaseTemplate } from './base';
import { getBaseUrl } from '../config';

interface EmailVerificationParams {
  name: string;
  email: string;
  token: string;
  expiresInHours?: number;
}

export function getEmailVerificationEmail(params: EmailVerificationParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, email, token, expiresInHours = 24 } = params;
  const displayName = name || email.split('@')[0];
  const baseUrl = getBaseUrl();
  const verifyUrl = `${baseUrl}/verify-email/${token}`;

  const content = `
    <h1 style="${baseStyles.heading}">Verify Your Email Address</h1>

    <p style="${baseStyles.paragraph}">
      Hello ${displayName},
    </p>

    <p style="${baseStyles.paragraph}">
      Thank you for creating a Markdown to PDF account! Please verify your email address
      to complete your registration and access all features.
    </p>

    <div style="text-align: center;">
      <a href="${verifyUrl}" style="${baseStyles.button}">
        Verify Email Address
      </a>
    </div>

    <p style="${baseStyles.paragraph}; ${baseStyles.muted}">
      This link will expire in ${expiresInHours} hours.
    </p>

    <div style="${baseStyles.divider}"></div>

    <p style="${baseStyles.paragraph}">
      If you didn't create an account with us, you can safely ignore this email.
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
Verify Your Email Address

Hello ${displayName},

Thank you for creating a Markdown to PDF account! Please verify your email address
to complete your registration and access all features.

Click the link below to verify your email:
${verifyUrl}

This link will expire in ${expiresInHours} hours.

If you didn't create an account with us, you can safely ignore this email.

Best regards,
The Markdown to PDF Team
  `.trim();

  return {
    subject: 'Verify your email address - Markdown to PDF',
    html,
    text,
  };
}
