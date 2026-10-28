import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';
const release = process.env.ROOMEDY_RELEASE_ID ?? '';
if (release && !/^[a-f0-9]{64}$/.test(release))
  throw new Error('invalid-release');
const selected = process.env.ROOMEDY_BUILD_DIR;
if (selected && !/^\.next-release-[ab]$/.test(selected))
  throw new Error('invalid-build-directory');

const config: NextConfig = {
  distDir:
    process.env.NODE_ENV === 'development'
      ? '.next-dev'
      : (selected ?? '.next'),
  output: 'standalone',
  outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)),
  env: { NEXT_PUBLIC_ROOMEDY_RELEASE_ID: release },
  ...(release ? { generateBuildId: async () => release } : {}),
  outputFileTracingExcludes: { '/*': ['./.env*', './src/**/*.map'] },
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  async headers() {
    // These exact versioned bytes are pinned by asset/release checks. Changed bytes need a new URL.
    return ['floor', 'wood', 'fabric', 'plaster'].flatMap((kind) =>
      ['detail', 'normal'].map((role) => ({
        source: `/surfaces/${kind}-${role}-v1.png`,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      })),
    );
  },
};
export default config;
