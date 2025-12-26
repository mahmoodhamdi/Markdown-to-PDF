/**
 * Team Invitation Email Template
 * Sent when a user is invited to join a team
 */

import { baseStyles, wrapInBaseTemplate } from './base';
import { getBaseUrl } from '../config';

interface TeamInvitationParams {
  recipientEmail: string;
  teamName: string;
  teamId: string;
  inviterName: string;
  inviterEmail: string;
  role: 'admin' | 'member';
  invitationToken: string;
}

export function getTeamInvitationEmail(params: TeamInvitationParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { recipientEmail, teamName, inviterName, inviterEmail, role, invitationToken } = params;
  const baseUrl = getBaseUrl();
  const acceptUrl = `${baseUrl}/en/invitation/${invitationToken}`;
  const roleText = role === 'admin' ? 'an administrator' : 'a member';

  const content = `
    <h1 style="${baseStyles.heading}">You're Invited to Join a Team!</h1>

    <p style="${baseStyles.paragraph}">
      Hello,
    </p>

    <p style="${baseStyles.paragraph}">
      <strong>${inviterName}</strong> (${inviterEmail}) has invited you to join
      <strong>${teamName}</strong> as ${roleText} on Markdown to PDF.
    </p>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; ${baseStyles.muted}">Team</p>
      <p style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">${teamName}</p>
      <p style="margin: 12px 0 0 0;">
        <span style="${baseStyles.badge}">${role.charAt(0).toUpperCase() + role.slice(1)}</span>
      </p>
    </div>

    <p style="${baseStyles.paragraph}">
      As a team member, you'll be able to:
    </p>

    <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #4a4a4a;">
      <li style="margin-bottom: 8px;">Collaborate with team members</li>
      <li style="margin-bottom: 8px;">Share documents and templates</li>
      <li style="margin-bottom: 8px;">Use shared team settings</li>
      ${role === 'admin' ? '<li style="margin-bottom: 8px;">Manage team members and settings</li>' : ''}
    </ul>

    <div style="text-align: center;">
      <a href="${acceptUrl}" style="${baseStyles.button}">
        Accept Invitation
      </a>
    </div>

    <div style="${baseStyles.divider}"></div>

    <p style="${baseStyles.paragraph}; ${baseStyles.muted}">
      This invitation was sent to ${recipientEmail}.
      If you don't want to join this team, you can simply ignore this email.
    </p>

    <p style="${baseStyles.paragraph}; ${baseStyles.muted}">
      If the button above doesn't work, copy and paste this link into your browser:
    </p>

    <p style="${baseStyles.muted}; word-break: break-all;">
      <a href="${acceptUrl}" style="${baseStyles.link}">${acceptUrl}</a>
    </p>
  `;

  const html = wrapInBaseTemplate(content);

  const text = `
You're Invited to Join a Team!

Hello,

${inviterName} (${inviterEmail}) has invited you to join ${teamName} as ${roleText} on Markdown to PDF.

Team: ${teamName}
Role: ${role.charAt(0).toUpperCase() + role.slice(1)}

As a team member, you'll be able to:
- Collaborate with team members
- Share documents and templates
- Use shared team settings
${role === 'admin' ? '- Manage team members and settings' : ''}

Accept the invitation at: ${acceptUrl}

This invitation was sent to ${recipientEmail}.
If you don't want to join this team, you can simply ignore this email.

Best regards,
The Markdown to PDF Team
  `.trim();

  return {
    subject: `${inviterName} invited you to join ${teamName} - Markdown to PDF`,
    html,
    text,
  };
}
