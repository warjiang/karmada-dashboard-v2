import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

const eslintrcConfig = require('./.eslintrc.cjs');

const lintFilePatterns = ['**/*.{js,jsx,ts,tsx}'];
const compatConfigs = compat.config(eslintrcConfig).map((config) => {
  if (config.files) {
    return config;
  }

  return {
    ...config,
    files: lintFilePatterns,
  };
});

export default [
  {
    ignores: [
      'package-lock.json',
      'pnpm-lock.yaml',
      'public',
      'dist',
      'build',
      'node_modules',
      'playwright-report',
      'test-results',
      'vite.config.ts',
      'scripts/*.js',
      '*.config.js',
      '**/*.cjs',
      '**/*.html',
    ],
  },
  ...compatConfigs,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
