import { defineConfig, globalIgnores } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: new URL('.', import.meta.url).pathname,
});

export default defineConfig([
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Workaround for a crash with the bundled @typescript-eslint rule under this toolchain.
      '@typescript-eslint/no-unused-expressions': 'off',

      // This repo currently uses `any` widely; keep lint actionable by not failing the build on it.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',

      // Style/JS rules that are noisy across the existing codebase.
      'prefer-const': 'off',
      'react/no-unescaped-entities': 'off',

      // App Router projects may still contain legacy anchors; don't fail lint on this.
      '@next/next/no-html-link-for-pages': 'off',

      // Keep lint non-blocking for existing legacy patterns.
      'react-hooks/rules-of-hooks': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/ban-types': 'off',
      'prefer-spread': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);
