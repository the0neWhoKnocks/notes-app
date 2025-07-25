const { resolve } = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const IgnoreEmitPlugin = require('ignore-emit-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const ENTRY_PREFIX__CSS = 'css/'; // folder path to dump CSS files in after compilation
const ENTRY_PREFIX__JS = 'js/'; // folder path to dump JS files in after compilation
const HASH_LENGTH = 5;
const alias = {
  svelte: resolve('node_modules', 'svelte/src/runtime'),
};
const conditionNames = [
  'require',
  'node',
  'svelte',
];
const extensions = [
  '.svelte',
  '.mjs',
  '.js',
  '.json',
  '.html',
];
const mainFields = [
  'svelte',
  'module',
  'browser',
  'main',
];
const mode = process.env.NODE_ENV || 'development';
const dev = mode === 'development';

const outputFilename = ({ chunk: { name }, contentHashType }) => {
  let _name;
  
  // Account for dynamic imports that likely won't have path prefixes.
  if (!name.includes('/')) {
    name = `${ENTRY_PREFIX__JS}${name}`;
  }
  
  switch (contentHashType) {
    case 'css/mini-extract': {
      // dump CSS files in a 'css' folder
      const newName = name.replace(new RegExp(`^${ENTRY_PREFIX__JS}`), ENTRY_PREFIX__CSS);
      _name = (name.endsWith('.css'))
        ? '[name]'
        : `${newName}_[contenthash:${HASH_LENGTH}].css`;
      break;
    }
    case 'javascript': {
      _name = (/\.(c|m)?js$/.test(name))
        ? '[name]'
        : `[name]_[contenthash:${HASH_LENGTH}].js`;
      break;
    }
  }
  
  return _name;
};

const conf = {
  devtool: dev && 'eval-source-map',
  entry: {
    'js/app': resolve(__dirname, './src/client/index.js'),
    'js/sw/constants.mjs': {
      import: resolve(__dirname, './src/client/serviceWorker/constants.mjs'),
      library: { type: 'module' },
    },
    'js/sw/genAPIPayload.mjs': {
      import: resolve(__dirname, './src/utils/genAPIPayload.js'),
      library: { type: 'module' },
    },
    'js/sw/modifyUserData.mjs': {
      import: resolve(__dirname, './src/utils/modifyUserData.js'),
      library: { type: 'module' },
    },
    'js/sw.register': resolve(__dirname, './src/client/serviceWorker/register.mjs'),
  },
  experiments: {
    outputModule: true,
  },
  mode,
  module: {
    rules: [
      {
        test: /\.(svelte|html)$/,
        use: {
          loader: 'svelte-loader',
          // Svelte compiler options: https://svelte.dev/docs#svelte_compile
          options: {
            dev,
            emitCss: true,
            hotReload: false, // pending https://github.com/sveltejs/svelte/issues/2377
          },
        },
      },
      {
        test: /\.css$/, // For any CSS files that are extracted and inlined by Svelte
        use: [
          MiniCssExtractPlugin.loader,
          // translates CSS into CommonJS
          {
            loader: 'css-loader',
            options: { sourceMap: dev },
          },
          // remove duplicate svelte classes
          { loader: resolve('./.webpack/loader.remove-duplicate-svelte-classes') },
        ],
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserJSPlugin({}),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      cacheGroups: {
        vendor: {
          chunks: 'initial',
          enforce: true,
          name: 'js/vendor',
          test: /[\\/]node_modules[\\/]/,
        },
      },
    },
  },
  output: {
    // Point sourcemap entries to original disk location (format as URL on Windows)
    devtoolModuleFilenameTemplate: info => resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
    // assigns the hashed name to the file
    chunkFilename: outputFilename,
    filename: outputFilename,
    path: resolve(__dirname, './dist/public'),
    publicPath: '/',
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [
        '**/*',
        '!manifest.json', // the watcher won't pick up on changes if this is deleted
        // NOTE - Uncomment/update the below if you have extra assets that should
        // not be deleted. Examples of such files/folders are anything generated
        // at startup before the bundling has started. Note that you have to
        // exclude the folder and it's contents separately.
        '!css',
        '!css/fonts',
        '!css/fonts/**/*',
        '!css/vendor',
        '!css/vendor/**/*',
        '!imgs',
        '!imgs/**/*',
        '!js',
        '!js/sw',
        '!js/sw/**/*',
        '!js/vendor',
        '!js/vendor/**/*',
      ],
      cleanStaleWebpackAssets: false, // Cleaning after rebuilds doesn't play nice with `mini-css-extract-plugin`
    }),
    new webpack.DefinePlugin({
      'process.env.FOR_CLIENT_BUNDLE': JSON.stringify(true),
      'process.env.TIME_ZONE': JSON.stringify(process.env.TIME_ZONE),
    }),
    new MiniCssExtractPlugin({
      chunkFilename: outputFilename,
      filename: outputFilename,
    }),
    /**
     * WP tries to emit the JS files for extracted CSS files, this prevents that
     */
    new IgnoreEmitPlugin(/global.+\.js(\.map)?$/),
    /**
     * Generate a manifest file which contains a mapping of all asset filenames
     * to their corresponding output file so that tools can load them without
     * having to know the hashed name.
     */
    new WebpackManifestPlugin({
      filter: ({ isChunk, isInitial, path }) => {
        return (
          (isChunk && isInitial)
          // ignore Stylus (`global` JS files) & source-map files
          && !/(global.+\.js|\.map)$/.test(path)
        );
      },
      map: (fd) => {
        // strip off preceding directory info, the name is enough
        fd.name = fd.name.split('/').pop();
        return fd;
      },
      writeToFileEmit: true,
    }),
  ],
  resolve: { alias, conditionNames, extensions, mainFields },
  stats: {
    children: false,
    entrypoints: false,
  },
  watch: dev,
};

// related to WSL2: https://github.com/microsoft/WSL/issues/4739
if (dev && !!process.env.WSL_INTEROP) {
  conf.watchOptions = {
    aggregateTimeout: 200,
    poll: 1000,
  };
}

module.exports = conf;
