import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/.next-dev/**',
      '**/.next-release-*/**',
      '.release/**',
      '**/node_modules/**',
      '**/next-env.d.ts',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['apps/frontend/**/*.{ts,tsx}'],
    settings: { next: { rootDir: 'apps/frontend/' } },
    plugins: { '@next/next': nextPlugin, 'react-hooks': reactHooks },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      'no-console': 'error',
    },
  },
  { files: ['apps/backend/src/server.ts'], rules: { 'no-console': 'off' } },
]);
