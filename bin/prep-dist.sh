#!/bin/sh

# In case any old deps get removed/renamed, don't want any false positives if
# code is referencing old files that shouldn't be getting used.
rm -rf ./dist/public/js/vendor

mkdir -p \
  ./dist \
  ./dist/public/css \
  ./dist/public/imgs \
  ./dist/public/js/sw \
  ./dist/public/js/vendor

# Sync Service Worker files. Have to use imports so that it can import the
# dynamically generated env file from the Server.
rsync -avh \
  --exclude 'constants.mjs' \
  --exclude 'register.mjs' \
  ./src/client/serviceWorker/* \
  ./dist/public/js/sw --delete

# Sync Server files, delete anything that doesn't exist anymore.
# These paths may need to be echoed in `watcher.js > watchedServerFiles`.
rsync -avh \
  ./src/server \
  ./src/utils \
  ./src/constants.js \
  ./dist --delete

# Sync fonts
rsync -avh \
  ./src/static/fonts \
  ./dist/public/css

# Sync favicons
rsync -avh \
  ./src/static/favicons \
  ./dist/public/imgs

# Sync Static module files (won't exist after a fresh clone)
if [ -d ./node_modules ]; then
  rsync -avh \
    ./node_modules/marked/marked.min.js \
    ./dist/public/js/vendor

  #########
  # Prism
  #########
  mkdir -p \
    ./dist/public/css/vendor/prism/plugins \
    ./dist/public/css/vendor/prism/themes \
    ./dist/public/js/vendor/prism \
    ./dist/public/js/vendor/prism/langs \
    ./dist/public/js/vendor/prism/plugins

  rsync -avh \
    ./node_modules/prismjs/plugins/line-numbers/prism-line-numbers.min.css \
    ./node_modules/prismjs/plugins/toolbar/prism-toolbar.min.css \
    ./dist/public/css/vendor/prism/plugins
  rsync -avh \
    ./node_modules/prismjs/themes/prism-coy.min.css \
    ./node_modules/prismjs/themes/prism-dark.min.css \
    ./node_modules/prismjs/themes/prism-funky.min.css \
    ./node_modules/prismjs/themes/prism-okaidia.min.css \
    ./node_modules/prismjs/themes/prism-solarizedlight.min.css \
    ./node_modules/prismjs/themes/prism-tomorrow.min.css \
    ./node_modules/prismjs/themes/prism-twilight.min.css \
    ./node_modules/prismjs/themes/prism.min.css \
    ./dist/public/css/vendor/prism/themes

  rsync -avh \
    ./node_modules/prismjs/components/prism-core.min.js \
    ./dist/public/js/vendor/prism
  rsync -avh \
    --exclude 'prism-core.min.js' \
    ./node_modules/prismjs/components/prism-*.min.js \
    ./dist/public/js/vendor/prism/langs
  rsync -avh \
    ./node_modules/prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js \
    ./node_modules/prismjs/plugins/line-numbers/prism-line-numbers.min.js \
    ./node_modules/prismjs/plugins/toolbar/prism-toolbar.min.js \
    ./dist/public/js/vendor/prism/plugins
fi
