/**
 * Welcome Email Template
 * Sent when a new user registers
 */

import { baseStyles, wrapInBaseTemplate } from './base';
import { getBaseUrl } from '../config';

interface WelcomeEmailParams {
  name: string;
  email: string;
}

export function getWelcomeEmail(params: WelcomeEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, email } = params;
  const displayName = name || email.split('@')[0];
  const baseUrl = getBaseUrl();

  const content = `
    <h1 style="${baseStyles.heading}">Welcome to Markdown to PDF!</h1>

    <p style="${baseStyles.paragraph}">
      Hello ${displayName},
    </p>

    <p style="${baseStyles.paragraph}">
      Thank you for signing up! We're excited to have you on board.
    </p>

    <p style="${baseStyles.paragraph}">
      With Markdown to PDF, you can:
    </p>

    <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #4a4a4a;">
      <li style="margin-bottom: 8px;">Convert Markdown to beautiful PDFs instantly</li>
      <li style="margin-bottom: 8px;">Choose from 8 professional document themes</li>
      <li style="margin-bottom: 8px;">Customize page settings, margins, and headers</li>
      <li style="margin-bottom: 8px;">Include syntax-highlighted code blocks</li>
      <li style="margin-bottom: 8px;">Add diagrams, math equations, and more</li>
    </ul>

    <div style="text-align: center;">
      <a href="${baseUrl}/editor" style="${baseStyles.button}">
        Start Creating PDFs
      </a>
    </div>

    <div style="${baseStyles.divider}"></div>

    <p style="${baseStyles.paragraph}">
      You're currently on the <span style="${baseStyles.badge}">Free Plan</span>
    </p>

    <p style="${baseStyles.paragraph}">
      Want more conversions and premium themes?
      <a href="${baseUrl}/pricing" style="${baseStyles.link}">Upgrade your plan</a>
    </p>

    <p style="${baseStyles.paragraph}; ${baseStyles.muted}">
      If you have any questions, just reply to this email. We're always happy to help!
    </p>
  `;

  const html = wrapInBaseTemplate(content);

  const text = `
Welcome to Markdown to PDF!

Hello ${displayName},

Thank you for signing up! We're excited to have you on board.

With Markdown to PDF, you can:
- Convert Markdown to beautiful PDFs instantly
- Choose from 8 professional document themes
- Customize page settings, margins, and headers
- Include syntax-highlighted code blocks
- Add diagrams, math equations, and more

Start creating PDFs at: ${baseUrl}/editor

You're currently on the Free Plan.

Want more conversions and premium themes? Upgrade at: ${baseUrl}/pricing

If you have any questions, just reply to this email. We're always happy to help!

Best regards,
The Markdown to PDF Team
  `.trim();

  return {
    subject: 'Welcome to Markdown to PDF!',
    html,
    text,
  };
}
