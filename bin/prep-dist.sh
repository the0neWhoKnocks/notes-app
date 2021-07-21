#!/bin/bash

# Create required directories
mkdir -p \
./dist/server \
./dist/public/css/vendor \
./dist/public/js/vendor

# Sync Server files, delete anything that doesn't exist anymore
rsync -avh \
  ./src/constants.js \
  ./src/server \
  ./src/utils \
  ./dist --delete

# Sync Static module files
rsync -avh \
  ./node_modules/prismjs/themes/prism-coy.css \
  ./node_modules/prismjs/themes/prism-dark.css \
  ./node_modules/prismjs/themes/prism-funky.css \
  ./node_modules/prismjs/themes/prism-okaidia.css \
  ./node_modules/prismjs/themes/prism-solarizedlight.css \
  ./node_modules/prismjs/themes/prism-tomorrow.css \
  ./node_modules/prismjs/themes/prism-twilight.css \
  ./node_modules/prismjs/themes/prism.css \
  ./dist/public/css/vendor
rsync -avh \
  ./node_modules/dompurify/dist/purify.min.js \
  ./node_modules/marked/marked.min.js \
  ./node_modules/prismjs/components/prism-apacheconf.min.js \
  ./node_modules/prismjs/components/prism-applescript.min.js \
  ./node_modules/prismjs/components/prism-arduino.min.js \
  ./node_modules/prismjs/components/prism-bash.min.js \
  ./node_modules/prismjs/components/prism-batch.min.js \
  ./node_modules/prismjs/components/prism-clike.min.js \
  ./node_modules/prismjs/components/prism-core.min.js \
  ./node_modules/prismjs/components/prism-css.min.js \
  ./node_modules/prismjs/components/prism-diff.min.js \
  ./node_modules/prismjs/components/prism-docker.min.js \
  ./node_modules/prismjs/components/prism-ejs.min.js \
  ./node_modules/prismjs/components/prism-git.min.js \
  ./node_modules/prismjs/components/prism-graphql.min.js \
  ./node_modules/prismjs/components/prism-groovy.min.js \
  ./node_modules/prismjs/components/prism-http.min.js \
  ./node_modules/prismjs/components/prism-ini.min.js \
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
  ./node_modules/prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js \
  ./dist/public/js/vendor
