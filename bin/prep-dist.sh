#!/bin/sh

mkdir -p \
  ./dist \
  ./dist/public/imgs \
  ./dist/public/js/vendor

# Sync Server files, delete anything that doesn't exist anymore.
# These paths may need to be echoed in `watcher.js > watchedServerFiles`.
rsync -avh \
  ./src/server \
  ./src/utils \
  ./src/constants.js \
  ./dist --delete

rsync -avh \
  ./src/static/favicons \
  ./dist/public/imgs

# Sync Static module files (won't exist after a fresh clone)
if [ -d ./node_modules ]; then
  rsync -avh \
    ./node_modules/dompurify/dist/purify.min.js \
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
    ./node_modules/prismjs/plugins/line-numbers/prism-line-numbers.css \
    ./node_modules/prismjs/plugins/toolbar/prism-toolbar.css \
    ./dist/public/css/vendor/prism/plugins
  rsync -avh \
    ./node_modules/prismjs/themes/prism-coy.css \
    ./node_modules/prismjs/themes/prism-dark.css \
    ./node_modules/prismjs/themes/prism-funky.css \
    ./node_modules/prismjs/themes/prism-okaidia.css \
    ./node_modules/prismjs/themes/prism-solarizedlight.css \
    ./node_modules/prismjs/themes/prism-tomorrow.css \
    ./node_modules/prismjs/themes/prism-twilight.css \
    ./node_modules/prismjs/themes/prism.css \
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
