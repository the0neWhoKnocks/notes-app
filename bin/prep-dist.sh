#!/bin/bash

# Create required directories
mkdir -p ./dist/server ./dist/public/js/vendor

# Sync Server files, delete anything that doesn't exist anymore
rsync -avh \
  ./src/constants.js \
  ./src/server \
  ./src/utils \
  ./dist --delete

# Sync Static module files
rsync -avh \
  ./node_modules/dompurify/dist/purify.min.js \
  ./node_modules/marked/marked.min.js \
  ./dist/public/js/vendor
