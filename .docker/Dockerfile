## Base Node image
FROM node:20.19.3-alpine3.22 AS node20-dev-base
# Add any extra base packages below. Comment why they're added for your own 
# sanity later. Add any App specific packages further down (there's a comment).
# - `rsync` for the `dist` setup
# - `tzdata` so the `TZ` env var works for timezones
# - `vim zsh` for development env
RUN apk add --no-cache --update rsync tzdata vim zsh

# Set up a usable terminal experience for development
RUN echo "update-notifier=false" >> /home/node/.npmrc
COPY ./.docker/.vimrc /home/node/.vimrc
COPY ./.docker/.zshrc /home/node/.zshrc
COPY ./.docker/zsh-autosuggestions.zsh /home/node/zsh-autosuggestions.zsh

## Create intermediary Container specifically for package.json 
FROM node20-dev-base AS notes--packagejson
# Create a temporary package.json where things like `version` and `scripts`
# are omitted so the cache of the build step won't be invalidated.
COPY --chown=node:node ./package*.json ./
RUN ["node", "-e", " \
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8')); \
  const lock = (fs.existsSync('package-lock.json')) \
    ? JSON.parse(fs.readFileSync('package-lock.json', 'utf-8')) \
    : false; \
  \
  let preInstallScript; \
  if (pkg.scripts && pkg.scripts.preinstall) preInstallScript = pkg.scripts.preinstall; \
  \
  delete pkg.devDependencies; \
  delete pkg.scripts; \
  delete pkg.version; \
  if (lock) delete lock.version; \
  \
  if (preInstallScript) pkg.scripts = { preinstall: preInstallScript }; \
  \
  fs.writeFileSync('package.json', JSON.stringify(pkg)); \
  if (lock) fs.writeFileSync('package-lock.json', JSON.stringify(lock)); \
"]

# Env where prod deps are installed
FROM node20-dev-base AS notes--prod
ENV APP=/home/node/app
ENV IN_CONTAINER=true
ENV NODE_ENV=production
RUN mkdir -p $APP/node_modules && chown -R node:node /home/node/*

######
## Add App specific packages below
######
#RUN apk add --no-cache --update __PKG__

WORKDIR $APP

# Copy over package related files from the preperation step to install
# production modules
COPY --chown=node:node --from=notes--packagejson ./package*.json ./

# Install production dependencies and compile assets
RUN npm i --only=production --quiet --unsafe-perm \
  && rm ./package*.json


# Env with dev deps to compile assets
FROM notes--prod AS notes--dev
# Install Dev deps (updated scripts or deps will invalidate build-cache)
COPY --chown=node:node ./package*.json ./
ENV NODE_ENV=development
RUN npm i --quiet
# Build is separate to utilize the build-cache if the package.json hasn't changed.
COPY --chown=node:node ./.webpack ./.webpack
COPY --chown=node:node ./bin/prep-dist.sh ./bin/
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./webpack.config.js ./
RUN npm run build


# Bring over compiled assets and finalize.
FROM notes--prod AS notes

COPY --chown=node:node --from=notes--dev $APP/dist/constants.js ./constants.js
COPY --chown=node:node --from=notes--dev $APP/dist/utils ./utils
COPY --chown=node:node --from=notes--dev $APP/dist/server ./server
COPY --chown=node:node --from=notes--dev $APP/dist/public ./public

# Expose the default port from the Server, on the container
EXPOSE 3000

# Start the app
CMD ["node", "server"]
