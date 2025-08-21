module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:n/recommended',
    'plugin:svelte/recommended',
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: [
    '@stylistic',
  ],
  rules: {
    '@stylistic/comma-dangle': ['error', {
      arrays: 'always-multiline',
      exports: 'always-multiline',
      functions: 'only-multiline',
      imports: 'always-multiline',
      objects: 'always-multiline',
    }],
    '@stylistic/keyword-spacing': ['error', { after: true, before: true }],
    '@stylistic/space-before-blocks': ['error', 'always'],
    'n/hashbang': 'off',
    'n/no-missing-import': ['error', {
      allowModules: [
        'svelte', // NOTE: There's a known issue where new modules with an `exports` section don't resolve in eslint: https://github.com/import-js/eslint-plugin-import/issues/1810
      ],
    }],
    'n/no-process-exit': 'off',
    'n/no-unpublished-import': 'off',
    'n/no-unpublished-require': 'off',
    'no-unused-vars': ['error', {
      args: 'after-used',
      argsIgnorePattern: "^_$",
    }],
  },
};
