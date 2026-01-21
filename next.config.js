const createNextIntlPlugin = require('next-intl/plugin');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Security headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://cdn.jsdelivr.net",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
  },
  // Add security headers to all routes
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = withBundleAnalyzer(withNextIntl(nextConfig));
