const { resolve } = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const IgnoreEmitPlugin = require('ignore-emit-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

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
  
  switch (contentHashType) {
    case 'css/mini-extract': {
      // dump CSS files in a 'css' folder
      const newName = name.replace(/^js\//, 'css/');
      _name = `${newName}_[chunkhash:${HASH_LENGTH}].css`;
      break;
    }
    case 'javascript': {
      _name = `[name]_[chunkhash:${HASH_LENGTH}].js`;
      break;
    }
  }
  
  return _name;
};

class RemoveDupeCSSClassPlugin {
  constructor() {
    this.SVELTE_RULE_REGEX = /\.svelte-[a-z0-9]+/g;
  }
  
  apply(compiler) {
    compiler.hooks.emit.tapAsync('RemoveDupeCSSClassPlugin', (compilation, callback) => {
      const { assets } = compilation;
      const files = Object.keys(assets).filter(a => a.startsWith('css/'));
      
      files.forEach((f) => {
        const asset = assets[f];
        let items;
        
        // normalize items to an Array to simplifiy processing
        if (asset.constructor.name === 'CachedSource') items = asset._source._children;
        else items = [asset];
        
        items.forEach((src) => {
          let valKey;
          
          if (src.constructor.name === 'RawSource') valKey = '_value';
          else if (src.constructor.name === 'SourceMapSource') valKey = '_valueAsString';
          
          const ruleMatches = (src[valKey].match(this.SVELTE_RULE_REGEX) || []);
          const rules = [...(new Set(ruleMatches)).values()];
          const matchedDupes = rules.reduce((arr, rule) => {
            const dupeRuleRegEx = new RegExp(`${rule}${rule}${Array(10).fill(`(?:${rule})?`).join('')}`, 'g');
            const matches = src[valKey].match(dupeRuleRegEx);
            
            if (matches) arr.push(...matches);
            
            return arr;
          }, []);
          // sort and reverse so that the longer dupe rules get replaced first
          const uniqueDupes = [...(new Set(matchedDupes)).values()].sort().reverse();
          
          uniqueDupes.forEach((dupeRule) => {
            const singleRule = `.${dupeRule.split('.')[1]}`;
            const regEx = new RegExp(dupeRule, 'g');
            
            src._valueAsBuffer = Buffer.from(
              src._valueAsBuffer.toString().replace(regEx, singleRule),
              'utf8'
            );
          });
        });
      });
      
      callback();
    });
  }
}

const conf = {
  devtool: dev && 'eval-source-map',
  entry: {
    'js/app': resolve(__dirname, './src/client/index.js'),
    'js/sw': resolve(__dirname, './src/client/serviceWorker/sw.js'),
    'js/sw.register': resolve(__dirname, './src/client/serviceWorker/register.js'),
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
        '!css/vendor',
        '!css/vendor/**/*',
        '!imgs',
        '!imgs/**/*',
        '!js',
        '!js/vendor',
        '!js/vendor/**/*',
        '!serviceWorker',
        '!serviceWorker/**/*',
        '!sw.js',
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
    new RemoveDupeCSSClassPlugin(),
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
