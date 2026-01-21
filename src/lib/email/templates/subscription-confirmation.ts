/**
 * Subscription Confirmation Email Template
 * Sent when a user subscribes to a plan
 */

import { baseStyles, wrapInBaseTemplate } from './base';
import { getBaseUrl } from '../config';
import { PlanType } from '@/lib/plans/config';

interface SubscriptionConfirmationParams {
  name: string;
  email: string;
  plan: PlanType;
  billing: 'monthly' | 'yearly';
  amount?: number;
  currency?: string;
  gateway?: string;
}

const planFeatures: Record<PlanType, string[]> = {
  free: ['5 daily conversions', '3 themes', '10MB max file size'],
  pro: [
    'Unlimited conversions',
    'All 8 premium themes',
    '50MB max file size',
    '1GB cloud storage',
    'Priority support',
  ],
  team: [
    'Everything in Pro',
    'Up to 10 team members',
    'Shared team settings',
    '10GB cloud storage',
    'Custom branding',
  ],
  enterprise: [
    'Everything in Team',
    'Unlimited team members',
    'SSO/SAML authentication',
    'Unlimited storage',
    'Dedicated support',
    'Custom integrations',
  ],
};

export function getSubscriptionConfirmationEmail(params: SubscriptionConfirmationParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { name, email, plan, billing, amount, currency, gateway } = params;
  const displayName = name || email.split('@')[0];
  const baseUrl = getBaseUrl();
  const features = planFeatures[plan] || planFeatures.pro;

  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const billingText = billing === 'yearly' ? 'yearly' : 'monthly';
  const amountText = amount && currency ? `${currency} ${(amount / 100).toFixed(2)}` : '';

  const content = `
    <h1 style="${baseStyles.heading}">Subscription Confirmed!</h1>

    <p style="${baseStyles.paragraph}">
      Hello ${displayName},
    </p>

    <p style="${baseStyles.paragraph}">
      Thank you for subscribing to the <strong>${planName} Plan</strong>!
      Your subscription is now active.
    </p>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 16px 0; color: #1a1a1a;">Subscription Details</h3>
      <table role="presentation" cellspacing="0" cellpadding="4" border="0" style="width: 100%;">
        <tr>
          <td style="color: #666;">Plan:</td>
          <td style="font-weight: 600;">${planName}</td>
        </tr>
        <tr>
          <td style="color: #666;">Billing:</td>
          <td style="font-weight: 600;">${billingText.charAt(0).toUpperCase() + billingText.slice(1)}</td>
        </tr>
        ${
          amountText
            ? `
        <tr>
          <td style="color: #666;">Amount:</td>
          <td style="font-weight: 600;">${amountText}/${billingText === 'yearly' ? 'year' : 'month'}</td>
        </tr>
        `
            : ''
        }
        ${
          gateway
            ? `
        <tr>
          <td style="color: #666;">Payment method:</td>
          <td style="font-weight: 600;">${gateway.charAt(0).toUpperCase() + gateway.slice(1)}</td>
        </tr>
        `
            : ''
        }
      </table>
    </div>

    <h3 style="margin: 24px 0 12px 0; color: #1a1a1a;">Your ${planName} Features</h3>
    <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #4a4a4a;">
      ${features.map((feature) => `<li style="margin-bottom: 8px;">${feature}</li>`).join('')}
    </ul>

    <div style="text-align: center;">
      <a href="${baseUrl}/editor" style="${baseStyles.button}">
        Start Using Your New Features
      </a>
    </div>

    <div style="${baseStyles.divider}"></div>

    <p style="${baseStyles.paragraph}">
      You can manage your subscription at any time from your
      <a href="${baseUrl}/settings/subscription" style="${baseStyles.link}">account settings</a>.
    </p>

    <p style="${baseStyles.paragraph}; ${baseStyles.muted}">
      If you have any questions about your subscription, just reply to this email.
    </p>
  `;

  const html = wrapInBaseTemplate(content);

  const text = `
Subscription Confirmed!

Hello ${displayName},

Thank you for subscribing to the ${planName} Plan! Your subscription is now active.

Subscription Details:
- Plan: ${planName}
- Billing: ${billingText.charAt(0).toUpperCase() + billingText.slice(1)}
${amountText ? `- Amount: ${amountText}/${billingText === 'yearly' ? 'year' : 'month'}` : ''}
${gateway ? `- Payment method: ${gateway.charAt(0).toUpperCase() + gateway.slice(1)}` : ''}

Your ${planName} Features:
${features.map((feature) => `- ${feature}`).join('\n')}

Start using your new features at: ${baseUrl}/editor

You can manage your subscription at: ${baseUrl}/settings/subscription

If you have any questions about your subscription, just reply to this email.

Best regards,
The Markdown to PDF Team
  `.trim();

  return {
    subject: `Your ${planName} Plan is now active - Markdown to PDF`,
    html,
    text,
  };
}
