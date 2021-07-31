import type { NextConfig } from 'next/dist/next-server/server/config';
import { env } from './src/server/env';

// https://github.com/leerob/leerob.io/pull/310
// https://twitter.com/leeerob/status/1381605539487047684
// https://securityheaders.com
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.youtube.com *.twitter.com cdn.segment.com *.hsforms.net *.hs-scripts.com *.hscollectedforms.net *.hs-analytics.net *.usemessages.com *.hs-banner.com;
  child-src *.youtube.com *.google.com *.twitter.com *.hubspot.com;
  style-src 'self' 'unsafe-inline' *.googleapis.com fonts.gstatic.com;
  font-src 'self' fonts.gstatic.com;
  img-src * blob: data:;
  media-src 'none';
  connect-src *;
`;

const securityHeaders = [
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: Partial<NextConfig> = {
  images: {
    domains: ['remoteok.io'],
  },
  webpack(config: any) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
  async headers() {
    return [
      {
        source: '/',
        headers: securityHeaders,
      },
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  // https://github.com/vercel/next.js/pull/14746
  experimental: {
    optimizeFonts: true,
  } as any,
  future: {},

  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
};

console.log(`${Object.keys(env).length} env vars.`);

module.exports = nextConfig;
