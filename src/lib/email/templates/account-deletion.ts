/**
 * Account Deletion Email Template
 * Sent when a user deletes their account
 */

import { baseStyles, wrapInBaseTemplate } from './base';
import { getBaseUrl } from '../config';

interface AccountDeletionParams {
  name: string;
  email: string;
}

export function getAccountDeletionEmail(params: AccountDeletionParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, email } = params;
  const displayName = name || email.split('@')[0];
  const baseUrl = getBaseUrl();
  const deletionDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const content = `
    <h1 style="${baseStyles.heading}">Account Deleted</h1>

    <p style="${baseStyles.paragraph}">
      Hello ${displayName},
    </p>

    <p style="${baseStyles.paragraph}">
      Your Markdown to PDF account has been successfully deleted as requested on ${deletionDate}.
    </p>

    <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; color: #1a1a1a;">What was deleted:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #4a4a4a;">
        <li style="margin-bottom: 8px;">Your profile and account settings</li>
        <li style="margin-bottom: 8px;">All stored files and documents</li>
        <li style="margin-bottom: 8px;">Conversion history and analytics</li>
        <li style="margin-bottom: 8px;">Team memberships (you were removed from all teams)</li>
        <li style="margin-bottom: 8px;">Any active subscriptions were canceled</li>
      </ul>
    </div>

    <p style="${baseStyles.paragraph}">
      We're sorry to see you go! If you'd like to use Markdown to PDF again in the future,
      you're always welcome to create a new account.
    </p>

    <div style="text-align: center;">
      <a href="${baseUrl}" style="${baseStyles.button}">
        Visit Markdown to PDF
      </a>
    </div>

    <div style="${baseStyles.divider}"></div>

    <p style="${baseStyles.paragraph}; ${baseStyles.muted}">
      If you did not request this deletion, please contact us immediately by replying to this email.
    </p>

    <p style="${baseStyles.paragraph}; ${baseStyles.muted}">
      This is a confirmation email. This email address (${email}) will no longer receive
      communications from Markdown to PDF.
    </p>
  `;

  const html = wrapInBaseTemplate(content);

  const text = `
Account Deleted

Hello ${displayName},

Your Markdown to PDF account has been successfully deleted as requested on ${deletionDate}.

What was deleted:
- Your profile and account settings
- All stored files and documents
- Conversion history and analytics
- Team memberships (you were removed from all teams)
- Any active subscriptions were canceled

We're sorry to see you go! If you'd like to use Markdown to PDF again in the future, you're always welcome to create a new account.

Visit us at: ${baseUrl}

If you did not request this deletion, please contact us immediately.

This is a confirmation email. This email address (${email}) will no longer receive communications from Markdown to PDF.

Best regards,
The Markdown to PDF Team
  `.trim();

  return {
    subject: 'Your account has been deleted - Markdown to PDF',
    html,
    text,
  };
}
