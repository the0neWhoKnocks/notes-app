const { resolve } = require('node:path');
const { includeIgnoreFile } = require('@eslint/compat');
const eslint = require('@eslint/js');
const stylistic = require('@stylistic/eslint-plugin');
const nodePlugin = require('eslint-plugin-n');
const sveltePlugin = require('eslint-plugin-svelte');
const globals = require('globals');
const playwright = require('eslint-plugin-playwright');
const svelteConfig = require('./svelte.config.js');

const giPath = resolve(__dirname, '.gitignore');
const nodeConf = nodePlugin.configs['flat/recommended'];
const playwrightConf = playwright.configs['flat/recommended'];
const langOpts = {
  ecmaVersion: 2024,
  sourceType: 'module',
  globals: {
    ...globals.browser,
    ...globals.node,
  },
};

module.exports = [
  includeIgnoreFile(giPath, 'Imported .gitignore patterns'),
  
  {
    name: 'global',
    files: [
      '**/*.cjs',
      '**/*.js',
      '**/*.mjs',
      '**/*.svelte',
    ],
    languageOptions: { ...langOpts },
    plugins: {
      ...stylistic.configs.recommended.plugins,
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...stylistic.configs.recommended.rules,
      
      '@stylistic/array-bracket-spacing': 'off',
      '@stylistic/arrow-parens': 'off',
      '@stylistic/comma-dangle': ['error', {
        arrays: 'always-multiline',
        exports: 'always-multiline',
        functions: 'only-multiline',
        imports: 'always-multiline',
        objects: 'always-multiline',
      }],
      '@stylistic/keyword-spacing': ['error', { after: true, before: true }],
      '@stylistic/max-statements-per-line': 'off',
      '@stylistic/no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      '@stylistic/no-trailing-spaces': ['error', {
        ignoreComments: true,
        skipBlankLines: true,
      }],
      '@stylistic/object-curly-spacing': 'off',
      '@stylistic/quotes': ['error', 'single', {
        allowTemplateLiterals: 'avoidEscape',
        avoidEscape: true,
      }],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/space-before-blocks': ['error', 'always'],
      '@stylistic/space-in-parens': 'off',
      '@stylistic/space-infix-ops': 'off',
      'no-unused-vars': ['error', {
        args: 'after-used',
        argsIgnorePattern: '^_$',
        caughtErrors: 'none',
      }],
    },
  },
  
  {
    name: 'node',
    files: [
      '**/*.cjs',
      '**/*.js',
      '**/*.mjs',
    ],
    ignores: ['src/client/**'],
    languageOptions: {
      ...nodeConf.languageOptions,
      ...langOpts,
    },
    plugins: { ...nodeConf.plugins },
    rules: {
      ...nodeConf.rules,
      'n/hashbang': 'off',
      'n/no-extraneous-require': ['error', {
        allowModules: [
          '@eslint/compat',
          '@eslint/js',
        ],
      }],
      'n/no-process-exit': 'off',
      'n/no-unpublished-import': 'off',
      'n/no-unpublished-require': 'off',
    },
  },
  
  // limit svelte plugins to a specific directory
  ...[...sveltePlugin.configs.recommended].reduce((arr, conf) => {
    const _conf = Object.assign({}, conf);
    if (_conf.files) _conf.files = _conf.files.map((f) => `src/client/${f}`);
    arr.push(_conf);
    return arr;
  }, []),
  {
    name: 'svelte-additional',
    files: [
      '**/*.cjs',
      '**/*.js',
      '**/*.mjs',
      '**/*.svelte',
    ],
    languageOptions: {
      ...langOpts,
      parserOptions: { svelteConfig },
    },
  },
  
  {
    name: 'e2e',
    files: ['e2e/playwright.config.js', 'e2e/tests/**'],
    languageOptions: {
      ...playwrightConf.languageOptions,
      ...langOpts,
    },
    plugins: { ...playwrightConf.plugins },
    rules: {
      ...playwrightConf.rules,
      
      'n/no-missing-import': ['error', {
        allowModules: [
          '@colors/colors',
          '@playwright/test', // NOTE: There's a known issue where new modules with an `exports` section don't resolve in eslint: https://github.com/import-js/eslint-plugin-import/issues/1810
        ],
      }],
      'n/no-unsupported-features/node-builtins': ['error', {
        ignores: [
          'localStorage',
          'navigator',
          'sessionStorage',
        ],
      }],
      'playwright/expect-expect': ['error', {
        assertFunctionNames: [
          'createConfig',
          'createUser',
          'deleteGroup',
          'deleteNote',
          'loadNotePage',
          'logIn',
          'moveNote',
        ],
      }],
      'playwright/no-conditional-expect': 'off',
      'playwright/no-conditional-in-test': 'off',
      'playwright/no-nested-step': 'off',
    },
  },
];
