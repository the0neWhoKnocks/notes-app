const cjsPlugin = require('@rollup/plugin-commonjs');
const cssPlugin = require('rollup-plugin-css-only');
const manifestPlugin = require('rollup-plugin-output-manifest').default;
const replacePlugin = require('@rollup/plugin-replace');
const resolvePlugin = require('@rollup/plugin-node-resolve');
const sveltePlugin = require('rollup-plugin-svelte');
const terserPlugin = require('@rollup/plugin-terser');

const OUTPUT_BASE = './dist/public';
const prod = process.env.NODE_ENV === 'production';
const dev = !prod;
const getPlugins = ({ client, svelte } = {}) => [
  // Replaces Strings in files with given value. Mainly using this for tree-shaking.
  // So if there's an `if` block referencing a variable, I can set it to `false`
  // and the block of code that now looks like `if (false) {` will be removed
  // because that block will never be reachable.
  replacePlugin({
    preventAssignment: true,
    values: {
      'process.env.FOR_CLIENT_BUNDLE': JSON.stringify(true),
      'process.env.NODE_ENV': JSON.stringify(undefined),
    },
  }),
  
  // Transform Svelte components into vanilla JS.
  svelte && sveltePlugin({
    compilerOptions: {
      dev, // enable run-time checks when not in production
    },
    emitCss: true,
  }),
  
  // Extract component CSS out into a separate file.
  svelte && cssPlugin(),
  
  // Use sveltePlugin if it comes across a module with a `svelte` export.
  resolvePlugin({
    browser: true,
    dedupe: ['svelte'],
    exportConditions: ['svelte'],
  }),
  
  // Allow CommonJS imports.
  cjsPlugin(),
  
  // Minimize Code
  prod && terserPlugin({ // https://github.com/terser/terser#minify-options
    ecma: 2025,
  }),
  
  // Generate a manifest of generated files.
  (client || svelte) && manifestPlugin({
    filter: (bundle) => { // add all files, skips chunks otherwise
      return !bundle.fileName?.endsWith('.map'); // ignore source-map files
    },
    isMerge: true,
    map: (bundle) => {
      if (bundle.name) {
        const parts = bundle.name.split('/');
        const name = parts.pop().replace(/\.(css|(c|m)?js)$/, '');
        
        // - Without this, the manifest will output: `"app.css.css": "/css/app_<HASH>.css",`.
        //   With this, it'll output: `"app.css": "/css/app_<HASH>.css",`.
        //   Couldn't figure out where the duplicate extension was coming from.
        // - This also trims the folder prefixes and just leaves the file name.
        Object.defineProperty(bundle, 'name', {
          get: () => { return name; },
        });
      }
      
      return bundle;
    },
    publicPath: '/',
  }),
];

const sharedBaseProps = {
  onLog(level, log, handler) {
    // Ignore circular dependency warnings (from Svelte https://github.com/sveltejs/svelte/issues/10140)
    if (log.code === 'CIRCULAR_DEPENDENCY' && log.message.includes('svelte')) { return; }
    
    handler(level, log); // otherwise, just print the log
  },
  watch: (dev) ? { clearScreen: false } : false, // doesn't work unless `-w` flag is passed in CLI
};

const sharedOutputProps = {
  assetFileNames: (nfo) => { // for CSS extracted from components
    const prefix = (nfo.name?.endsWith('.css')) ? 'css/' : '';
    return `${prefix}[name]_[hash:6][extname]`;
  },
  chunkFileNames: '[name]_[hash:6].mjs', // for `manualChunks` and any other chunk that's parsed
  dir: OUTPUT_BASE,
  entryFileNames: (nfo) => { // for `input` items
    return (/\.((c|m)?js)$/.test(nfo.name)) ? '[name]' : '[name]_[hash:6].mjs';
  },
  hashCharacters: 'hex',
  sourcemap: dev,
};

module.exports = [
  {
    ...sharedBaseProps,
    input: { 'js/app': './src/client/index.js' },
    output: {
      ...sharedOutputProps,
      format: 'esm',
      manualChunks: (id) => {
        if (id.includes('node_modules')) { return 'js/vendor'; }
        return null;
      },
    },
    plugins: getPlugins({ svelte: true }),
  },
  {
    ...sharedBaseProps,
    input: { 'js/sw.register': './src/client/serviceWorker/register.mjs' },
    output: { ...sharedOutputProps, format: 'esm' },
    plugins: getPlugins({ client: true }),
  },
  {
    ...sharedBaseProps,
    input: {
      'constants.mjs': './src/client/serviceWorker/constants.mjs',
      'genAPIPayload.mjs': './src/utils/genAPIPayload.mjs',
      'modifyUserData.mjs': './src/utils/modifyUserData.mjs',
    },
    output: {
      ...sharedOutputProps,
      dir: `${sharedOutputProps.dir}/js/sw`,
      format: 'esm',
    },
    plugins: getPlugins(),
  },
];
