#!/bin/bash

# Create required directories
mkdir -p ./dist/server ./dist/public

# Sync Server files, delete anything that doesn't exist anymore
rsync -avh \
  ./src/constants.js \
  ./src/server \
  ./src/utils \
  ./dist --delete
