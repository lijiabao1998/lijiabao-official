// Unit tests (spec §9.1 tests/unit/*). Pure, Node-only modules (gl/gen/*, i18n, data). The tsconfig aliases are
// mirrored here so tests may import '@gl/gen/lanes' etc. (.mjs: not type-checked, no @types/node needed).
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dir = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@i18n': dir('./src/i18n'),
      '@data': dir('./src/data'),
      '@gl': dir('./src/gl'),
      '@motion': dir('./src/motion'),
      '@ui': dir('./src/components/ui'),
      '@lib': dir('./src/lib'),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    cacheDir: './.cache/vitest',
  },
});
