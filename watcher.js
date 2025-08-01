#!/usr/bin/env node

const { create } = require('browser-sync');
const nodemon = require('nodemon');
const chokidar = require('chokidar');
const logger = require('./src/utils/logger')('watcher');
const { SERVER__PORT } = require('./src/constants');
let httpModule;
let protocol = 'http';
const browserSync = create();
let bSyncHTTPS;

if (process.env.NODE_EXTRA_CA_CERTS) {
  httpModule = require('https');
  protocol = 'https';
  bSyncHTTPS = {
    cert: process.env.NODE_EXTRA_CA_CERTS,
    key: process.env.NODE_EXTRA_CA_CERTS.replace('.crt', '.key'),
  }
}
else {
  httpModule = require('http');
}
const checkServer = () => new Promise((rootResolve, rootReject) => {
  let count = 0;
  const check = () => new Promise((resolve, reject) => {
    setTimeout(() => {
      const serverAddress = `${protocol}://localhost:${SERVER__PORT}`;
      const opts = {};

      if (protocol === 'https') {
        // NOTE - Depending on your Dev env, your self-signed certs may
        // throw this error `UNABLE_TO_VERIFY_LEAF_SIGNATURE` during Server
        // restart. Not sure why it doesn't happen on start of the Server, but
        // this will get around that issue (which is fine in development, not Prod).
        opts.rejectUnauthorized = false;
      }
      logger.info(`Pinging ${serverAddress}`);
      httpModule
        .get(serverAddress, opts, (res) => resolve(res))
        .on('error', (err) => reject(err));
    }, 1000);
  });
  const handleError = (err) => {
    if (count < 3) {
      ping();
      count++;
    }
    else {
      logger.info(err);
      rootReject();
    }
  };
  const handleSuccess = () => { rootResolve(); };
  const ping = () => {
    check()
      .then(handleSuccess)
      .catch(handleError);
  };

  ping();
});

const fileCheck = (file, timeout = 30) => new Promise((resolveCheck, rejectCheck) => {
  const { existsSync } = require('fs');
  const { resolve } = require('path');
  const filePath = resolve(__dirname, file);
  const exists = () => existsSync(filePath);
  let elapsedTime = 0;

  if (exists()) resolveCheck();
  else {
    logger.info(`Waiting for "${filePath}"\n to exist before starting.\n`);
    const int = setInterval(() => {
      elapsedTime++;
      logger.info('Looking for file');
      
      if (exists()) {
        logger.info('File found, starting...\n');
        clearInterval(int);
        resolveCheck();
      }
      else if (elapsedTime === timeout) {
        clearInterval(int);
        rejectCheck(`\nWaited for ${timeout} seconds for "${filePath}"\n to exist, but it was not found.\n`);
      }
    }, 1000);
  }
});

const args = process.argv.splice(2);
const serverSyncCmd = args[0];
const waitForFileBeforeStart = args[1];
const fileGate = (waitForFileBeforeStart)
  ? fileCheck(waitForFileBeforeStart)
  : Promise.resolve();

const watchedFiles = [
  './src/client/serviceWorker/**/*.mjs',
  './src/server/**/*.js',
  './src/utils/**/*.js',
  './src/constants.js',
];
const watchedClientFiles = [
  'dist/public/js/sw/**/*.mjs', // SW files copied over
  'dist/public/manifest.json', // WP generated bundles
];
const ignoredFiles = [
  './src/client/serviceWorker/constants.mjs',
  './src/client/serviceWorker/register.mjs',
];

const chokidarOpts = {
  ignoreInitial: true,
  ignored: ignoredFiles,
};

fileGate
  .then(() => {
    const serverFilesWatcher = chokidar.watch(watchedFiles, chokidarOpts);
    serverFilesWatcher
      .on('ready', () => {
        logger.info('Watching for Server changes');
      })
      .on('all', (ev, p) => { // events are: add addDir change unlink unlinkDir
        if (!serverFilesWatcher.events) serverFilesWatcher.events = [];
        serverFilesWatcher.events.push([ev, p]);

        if (!serverFilesWatcher.debounce) {
          serverFilesWatcher.debounce = setTimeout(() => {
            logger.info(`Server updates:\n  - ${serverFilesWatcher.events.map(([_ev, _p]) => `${_ev}: ${_p}`).join('\n  - ')}`);
            delete serverFilesWatcher.debounce;
            delete serverFilesWatcher.events;
            
            if (serverSyncCmd) {
              const { execSync } = require('child_process');
              execSync(serverSyncCmd);
            }
          }, 300);
        }
      });

    nodemon({
      delay: 500,
      exec: 'node --inspect=0.0.0.0',
      ext: 'js json',
      ignore: ignoredFiles,
      script: './dist/server',
      // verbose: true,
      watch: watchedFiles,
    })
      .on('restart', () => {
        logger.info('Server restarting because file(s) changed');
    
        checkServer()
          .then(() => {
            logger.info('Server has fully started');
            browserSync.reload();
          })
          .catch(() => {
            logger.info("Couldn't detect the Server, a manual reload may be required");
          });
      });
    // https://www.browsersync.io/docs/options
    browserSync.init({
      files: watchedClientFiles,
      ghostMode: false, // don't mirror interactions in other browsers
      https: bSyncHTTPS,
      // logLevel: 'debug',
      notify: false, // Don't show any notifications in the browser.
      open: false,
      port: SERVER__PORT + 1,
      proxy: {
        target: `${protocol}://localhost:${SERVER__PORT}`,
        ws: true,
      },
      reloadDebounce: 300, // Wait for a specified window of event-silence before sending any reload events.
      snippetOptions: {
        rule: {
          match: /<\/body>/i,
          fn: (snippet) => snippet,
        },
      },
      ui: {
        port: SERVER__PORT + 2,
      },
      watchOptions: chokidarOpts,
    });
    
    function killWatcher(evType) {
      logger.info(`Killing watcher (${evType})`);
      browserSync.exit();
      serverFilesWatcher.close();
      nodemon.emit('quit');
      process.exit(0);
    }
    
    process.on('SIGINT', killWatcher.bind(null, 'SIGINT'));
    process.on('SIGTERM', killWatcher.bind(null, 'SIGTERM'));
    process.on('SIGUSR2', killWatcher.bind(null, 'SIGUSR2'));
  })
  .catch(err => {
    logger.error(err);
    process.exit(1);
  });
  