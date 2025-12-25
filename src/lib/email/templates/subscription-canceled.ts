/**
 * Subscription Canceled Email Template
 * Sent when a user cancels their subscription
 */

import { baseStyles, wrapInBaseTemplate } from './base';
import { getBaseUrl } from '../config';
import { PlanType } from '@/lib/plans/config';

interface SubscriptionCanceledParams {
  name: string;
  email: string;
  plan: PlanType;
  endDate?: Date;
  immediate?: boolean;
}

export function getSubscriptionCanceledEmail(params: SubscriptionCanceledParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, email, plan, endDate, immediate = false } = params;
  const displayName = name || email.split('@')[0];
  const baseUrl = getBaseUrl();
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);

  const endDateText = endDate
    ? endDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'soon';

  const content = immediate
    ? `
    <h1 style="${baseStyles.heading}">Subscription Canceled</h1>

    <p style="${baseStyles.paragraph}">
      Hello ${displayName},
    </p>

    <p style="${baseStyles.paragraph}">
      Your ${planName} Plan subscription has been canceled and your account has been
      downgraded to the Free Plan effective immediately.
    </p>

    <p style="${baseStyles.paragraph}">
      We're sorry to see you go! If you canceled by mistake or changed your mind,
      you can resubscribe at any time.
    </p>

    <div style="text-align: center;">
      <a href="${baseUrl}/pricing" style="${baseStyles.button}">
        Resubscribe
      </a>
    </div>

    <div style="${baseStyles.divider}"></div>

    <h3 style="margin: 0 0 12px 0; color: #1a1a1a;">What you'll lose with the Free Plan:</h3>
    <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #4a4a4a;">
      <li style="margin-bottom: 8px;">Unlimited conversions (now limited to 5/day)</li>
      <li style="margin-bottom: 8px;">Premium themes (now limited to 3 themes)</li>
      <li style="margin-bottom: 8px;">Cloud storage (files will be deleted after 30 days)</li>
    </ul>

    <p style="${baseStyles.paragraph}; ${baseStyles.muted}">
      If you have any feedback or need help, please reply to this email.
    </p>
  `
    : `
    <h1 style="${baseStyles.heading}">Subscription Cancelation Scheduled</h1>

    <p style="${baseStyles.paragraph}">
      Hello ${displayName},
    </p>

    <p style="${baseStyles.paragraph}">
      Your ${planName} Plan subscription has been scheduled for cancelation.
      You'll continue to have access to all ${planName} features until:
    </p>

    <div style="text-align: center; margin: 24px 0;">
      <span style="display: inline-block; padding: 12px 24px; background-color: #fff3e0; color: #e65100; border-radius: 8px; font-size: 18px; font-weight: 600;">
        ${endDateText}
      </span>
    </div>

    <p style="${baseStyles.paragraph}">
      After this date, your account will be downgraded to the Free Plan.
    </p>

    <p style="${baseStyles.paragraph}">
      Changed your mind? You can cancel this request and keep your subscription:
    </p>

    <div style="text-align: center;">
      <a href="${baseUrl}/settings/subscription" style="${baseStyles.button}">
        Keep My Subscription
      </a>
    </div>

    <div style="${baseStyles.divider}"></div>

    <p style="${baseStyles.paragraph}; ${baseStyles.muted}">
      If you have any feedback or need help, please reply to this email.
    </p>
  `;

  const html = wrapInBaseTemplate(content);

  const text = immediate
    ? `
Subscription Canceled

Hello ${displayName},

Your ${planName} Plan subscription has been canceled and your account has been downgraded to the Free Plan effective immediately.

We're sorry to see you go! If you canceled by mistake or changed your mind, you can resubscribe at any time.

Resubscribe at: ${baseUrl}/pricing

What you'll lose with the Free Plan:
- Unlimited conversions (now limited to 5/day)
- Premium themes (now limited to 3 themes)
- Cloud storage (files will be deleted after 30 days)

If you have any feedback or need help, please reply to this email.

Best regards,
The Markdown to PDF Team
    `.trim()
    : `
Subscription Cancelation Scheduled

Hello ${displayName},

Your ${planName} Plan subscription has been scheduled for cancelation.
You'll continue to have access to all ${planName} features until ${endDateText}.

After this date, your account will be downgraded to the Free Plan.

Changed your mind? You can cancel this request at: ${baseUrl}/settings/subscription

If you have any feedback or need help, please reply to this email.

Best regards,
The Markdown to PDF Team
    `.trim();

  return {
    subject: immediate
      ? 'Your subscription has been canceled - Markdown to PDF'
      : 'Your subscription cancelation is scheduled - Markdown to PDF',
    html,
    text,
  };
}
