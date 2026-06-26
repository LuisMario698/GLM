import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { optimizePackageImports: ['lucide-react'] },
};

export default process.env.NODE_ENV === 'production'
  ? withSerwistInit({
      swSrc: 'src/app/sw.ts',
      swDest: 'public/sw.js',
      additionalPrecacheEntries: [{ url: '/offline', revision: process.env.VERCEL_GIT_COMMIT_SHA ?? 'glm-v2' }],
      globPublicPatterns: ['icons/*.svg', 'manifest.webmanifest'],
    })(config)
  : config;
