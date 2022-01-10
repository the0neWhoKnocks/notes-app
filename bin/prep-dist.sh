#!/bin/bash

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

# Sync Static module files
rsync -avh \
  ./node_modules/dompurify/dist/purify.min.js \
  ./node_modules/marked/marked.min.js \
  ./dist/public/js/vendor

rsync -avh \
  ./src/static/favicons \
  ./dist/public/imgs

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
  ./node_modules/prismjs/components/prism-apacheconf.min.js \
  ./node_modules/prismjs/components/prism-applescript.min.js \
  ./node_modules/prismjs/components/prism-arduino.min.js \
  ./node_modules/prismjs/components/prism-bash.min.js \
  ./node_modules/prismjs/components/prism-batch.min.js \
  ./node_modules/prismjs/components/prism-c.min.js \
  ./node_modules/prismjs/components/prism-clike.min.js \
  ./node_modules/prismjs/components/prism-cpp.min.js \
  ./node_modules/prismjs/components/prism-css.min.js \
  ./node_modules/prismjs/components/prism-diff.min.js \
  ./node_modules/prismjs/components/prism-docker.min.js \
  ./node_modules/prismjs/components/prism-ejs.min.js \
  ./node_modules/prismjs/components/prism-git.min.js \
  ./node_modules/prismjs/components/prism-graphql.min.js \
  ./node_modules/prismjs/components/prism-groovy.min.js \
  ./node_modules/prismjs/components/prism-http.min.js \
  ./node_modules/prismjs/components/prism-ini.min.js \
  ./node_modules/prismjs/components/prism-javadoclike.min.js \
  ./node_modules/prismjs/components/prism-javascript.min.js \
  ./node_modules/prismjs/components/prism-jsdoc.min.js \
  ./node_modules/prismjs/components/prism-json.min.js \
  ./node_modules/prismjs/components/prism-json5.min.js \
  ./node_modules/prismjs/components/prism-jsonp.min.js \
  ./node_modules/prismjs/components/prism-jsx.min.js \
  ./node_modules/prismjs/components/prism-log.min.js \
  ./node_modules/prismjs/components/prism-markdown.min.js \
  ./node_modules/prismjs/components/prism-markup.min.js \
  ./node_modules/prismjs/components/prism-nginx.min.js \
  ./node_modules/prismjs/components/prism-php.min.js \
  ./node_modules/prismjs/components/prism-python.min.js \
  ./node_modules/prismjs/components/prism-regex.min.js \
  ./node_modules/prismjs/components/prism-sql.min.js \
  ./node_modules/prismjs/components/prism-vim.min.js \
  ./node_modules/prismjs/components/prism-wasm.min.js \
  ./node_modules/prismjs/components/prism-yaml.min.js \
  ./dist/public/js/vendor/prism/langs
rsync -avh \
  ./node_modules/prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js \
  ./node_modules/prismjs/plugins/line-numbers/prism-line-numbers.min.js \
  ./node_modules/prismjs/plugins/toolbar/prism-toolbar.min.js \
  ./dist/public/js/vendor/prism/plugins
