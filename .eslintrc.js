module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: 'eslint:recommended',
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
    },
  ],
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  plugins: [
    'svelte3',
  ],
  rules: {
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      exports: 'always-multiline',
      functions: 'only-multiline',
      imports: 'always-multiline',
      objects: 'always-multiline',
    }],
    'keyword-spacing': ['error', { after: true, before: true }],
    'no-unused-vars': ['error', { args: 'after-used' }],
    'space-before-blocks': ['error', 'always'],
  },
};
