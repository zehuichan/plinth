import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier/flat';
import turboConfig from 'eslint-config-turbo/flat';
import tseslint from 'typescript-eslint';
import vuePlugin from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/es/**',
      '**/*.tsbuildinfo',
      '**/coverage/**',
      '**/.turbo/**',
      '.changeset/**',
      'vitest.config.ts',
      'eslint.config.mjs',
      'docs/.vitepress/cache/**',
      'docs/.vitepress/dist/**',
      'scripts/bootstrap/**',
    ],
  },
  ...turboConfig,
  {
    rules: {
      'turbo/no-undeclared-env-vars': 'off',
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vuePlugin.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2022,
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/attributes-order': 'off',
      'vue/require-default-prop': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    files: ['packages/**/*.vue'],
    rules: {
      // Library styles rely on the prefixed class names, never on scoped hashes.
      'vue/enforce-style-attribute': ['error', { allow: ['plain'] }],
    },
  },
  {
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'vue/one-component-per-file': 'off',
    },
  },
  {
    files: [
      'playground/**/*.vue',
      'docs/components/**/demo/**/*.vue',
      'docs/hooks/**/demo/**/*.vue',
    ],
    rules: {
      'vue/singleline-html-element-content-newline': 'off',
      'vue/max-attributes-per-line': 'off',
    },
  },
  {
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLElement: 'readonly',
      },
    },
  },
  prettierConfig,
];
