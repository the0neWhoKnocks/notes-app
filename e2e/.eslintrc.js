module.exports = {
  extends: [
    'plugin:playwright/recommended',
  ],
  overrides: [
    {
      files: 'tests/**',
    },
  ],
  rules: {
    'n/no-missing-import': ['error', {
      allowModules: [
        '@colors/colors',
        '@playwright/test', // NOTE: There's a known issue where new modules with an `exports` section don't resolve in eslint: https://github.com/import-js/eslint-plugin-import/issues/1810
      ],
    }],
    'n/no-unsupported-features/node-builtins': ['error', {
      'ignores': [
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
    'playwright/no-nested-step': 'off',
  },
};
