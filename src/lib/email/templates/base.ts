/**
 * Base Email Template
 * Provides common styling and structure for all emails
 */

import { getBaseUrl } from '../config';

/**
 * Base styles for email templates
 */
export const baseStyles = {
  container: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
    background-color: #ffffff;
  `,
  header: `
    text-align: center;
    margin-bottom: 30px;
  `,
  logo: `
    font-size: 24px;
    font-weight: bold;
    color: #0070f3;
    text-decoration: none;
  `,
  content: `
    padding: 20px 0;
    line-height: 1.6;
    color: #333333;
  `,
  heading: `
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 20px 0;
  `,
  paragraph: `
    font-size: 16px;
    color: #4a4a4a;
    margin: 0 0 16px 0;
    line-height: 1.6;
  `,
  button: `
    display: inline-block;
    padding: 14px 28px;
    background-color: #0070f3;
    color: #ffffff;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    margin: 20px 0;
  `,
  buttonSecondary: `
    display: inline-block;
    padding: 14px 28px;
    background-color: #f5f5f5;
    color: #333333;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    margin: 20px 0;
    border: 1px solid #e0e0e0;
  `,
  footer: `
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e0e0e0;
    text-align: center;
    color: #888888;
    font-size: 14px;
  `,
  link: `
    color: #0070f3;
    text-decoration: none;
  `,
  muted: `
    color: #888888;
    font-size: 14px;
  `,
  divider: `
    height: 1px;
    background-color: #e0e0e0;
    margin: 24px 0;
  `,
  badge: `
    display: inline-block;
    padding: 4px 12px;
    background-color: #e8f4fd;
    color: #0070f3;
    border-radius: 16px;
    font-size: 14px;
    font-weight: 500;
  `,
};

/**
 * Wrap content in the base email template
 */
export function wrapInBaseTemplate(content: string): string {
  const baseUrl = getBaseUrl();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Markdown to PDF</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="${baseStyles.container}; background-color: #ffffff; border-radius: 8px; margin: 0 auto;">
          <tr>
            <td style="${baseStyles.header}">
              <a href="${baseUrl}" style="${baseStyles.logo}">
                Markdown to PDF
              </a>
            </td>
          </tr>
          <tr>
            <td style="${baseStyles.content}">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="${baseStyles.footer}">
              <p style="margin: 0 0 8px 0;">
                <a href="${baseUrl}" style="${baseStyles.link}">Markdown to PDF</a>
              </p>
              <p style="margin: 0; ${baseStyles.muted}">
                Convert Markdown to beautiful PDFs
              </p>
              <p style="margin: 16px 0 0 0; ${baseStyles.muted}">
                You received this email because you have an account with us.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Strip HTML for plain text version
 */
export function stripHtmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}
