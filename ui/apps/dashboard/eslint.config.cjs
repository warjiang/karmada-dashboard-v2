const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = [
  {
    ignores: [
      'package-lock.json',
      'pnpm-lock.yaml',
      'public/**',
      'dist/**',
      'build/**',
      'node_modules/**',
      'e2e/**',
      'playwright-report/**',
      'test-results/**',
      'index.html',
      'vite.config.ts',
      'scripts/*.js',
      '*.config.js',
      '*.config.cjs',
      '*.config.mjs',
      '.eslintrc.cjs',
    ],
  },
  ...compat.config(require('./.eslintrc.cjs')),
];
