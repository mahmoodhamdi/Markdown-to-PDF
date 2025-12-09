const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
  },
  // Disable static export for dynamic routes with next-intl
  // This is needed since we use dynamic server features
};

module.exports = withNextIntl(nextConfig);
