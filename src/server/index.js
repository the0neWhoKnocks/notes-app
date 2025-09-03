const { STATUS_CODES } = require('node:http');
const { readFileSync, existsSync } = require('node:fs');
const compression = require('compression');
const glob = require('fast-glob');
const sirv = require('sirv');
const bodyParser = require('body-parser');
const mkdirp = require('mkdirp');
const {
  APP__TITLE,
  PATH__CONFIG,
  PATH__DATA,
  PATH__PUBLIC,
  ROUTE__API__CONFIG__CREATE,
  ROUTE__API__USER__DATA__GET,
  ROUTE__API__USER__DATA__SET,
  ROUTE__API__USER__LOGIN,
  ROUTE__API__USER__PROFILE__CREATE,
  ROUTE__API__USER__PROFILE__DELETE,
  ROUTE__API__USER__PROFILE__GET,
  ROUTE__API__USER__PROFILE__SET,
  SERVER__PORT,
} = require('../constants');
const log = require('../utils/logger')('server');
const createConfig = require('./api/config.create');
const createUserProfile = require('./api/user.profile.create');
const deleteUserProfile = require('./api/user.profile.delete');
const getUserData = require('./api/user.data.get');
const setUserData = require('./api/user.data.set');
const userLogin = require('./api/user.login');
const getUserProfile = require('./api/user.profile.get');
const setUserProfile = require('./api/user.profile.set');
const shell = require('./shell');

const { NODE_ENV } = process.env;
const dev = NODE_ENV !== 'production';
const middleware = [
  compression({ threshold: 0 }),
  sirv(PATH__PUBLIC, { dev, etag: true }),
];

const PUBLIC_CSS_VENDOR = 'css/vendor';
const PUBLIC_JS_VENDOR = 'js/vendor';
const CLIENT_LANGS_PATH = `${PUBLIC_JS_VENDOR}/prism/langs`;
const CLIENT_THEMES_PATH = `${PUBLIC_CSS_VENDOR}/prism/themes`;
const ABS_LANGS_PATH = `${__dirname}/../public/${CLIENT_LANGS_PATH}`;
const ABS_THEMES_PATH = `${__dirname}/../public/${CLIENT_THEMES_PATH}`;
const langFiles = (glob.sync('*.js', { cwd: ABS_LANGS_PATH })).map(lang => `/${CLIENT_LANGS_PATH}/${lang}`);
const themeFiles = (glob.sync('*.css', { cwd: ABS_THEMES_PATH })).map(theme => `/${CLIENT_THEMES_PATH}/${theme}`);
const swEnvVars = JSON.stringify({
  allowedDomains: process.env.SW__ALLOWED_DOMAINS?.split(' ').filter((d) => !!d),
  appId: process.env.SW__APP_ID,
});

function app(req, res) {
  const [url] = req.url.split('?');
  const handlers = app.reqHandlers.reduce((arr, { handlers, path, type }) => {
    switch (type) {
      case 'GET':
      case 'POST': {
        if (req.method === type && url === path) arr.push(...handlers);
        break;
      }
      default: arr.push(...handlers);
    }
    return arr;
  }, []);
  let funcNdx = 0;
  
  handlers.push(app.notFoundHandler);
  
  const next = (err) => {
    if (err) res.error(err);
    else if (handlers[funcNdx]) {
      funcNdx++;
      handlers[funcNdx-1](req, res, next);
    }
  };
  
  next();
}
app.reqHandlers = [];
app.pathHandler = (method) => function pathHandler(path, ...handlers) {
  app.reqHandlers.push({ handlers, path, type: method });
  return app;
};
app.notFoundHandler = function notFound(req, res) {
  const CODE = 404;
  const body = STATUS_CODES[CODE];
  
  log.debug(`Nothing found for "${req.url}"`);
  
  res
    .writeHead(CODE, {
      'Content-Length': Buffer.byteLength(body),
      'Content-Type': 'text/plain',
    })
    .end(body);
};
app.get = app.pathHandler('GET');
app.post = app.pathHandler('POST');
app.use = function use(...handlers) {
  if (handlers.length) app.reqHandlers.push({ handlers, type: 'use' });
  return app;
};
const jsonParser = bodyParser.json({
  limit: '100mb', // default is '100kb'
});

if (!existsSync(PATH__DATA)) mkdirp.sync(PATH__DATA);

app
  .use((req, res, next) => {
    if (!res.error) {
      res.error = (...err) => {
        let error;
        let statusCode;
        
        if (typeof err[0] === 'number') {
          const [c, e] = err;
          error = e;
          statusCode = c;
        }
        else if (err[0] instanceof Error) {
          const { message: e, statusCode: c } = err[0];
          error = e;
          statusCode = c;
        }
        
        log.error(`[${statusCode}] | ${error}`);
        // NOTE - utilizing `message` so that if an Error is thrown on the Client
        // within a `then`, there's no extra logic to get error data within the
        // `catch`.
        res.status(statusCode).json({ message: error });
      };
    }
    
    if (!res.json) {
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };
    }
    
    if (!res.status) {
      res.status = (statusCode) => {
        res.statusCode = statusCode;
        return res;
      };
    }
  
    next();
  })
  // Dynamically generating a 'file' for env vars since SWs can't dynamically
  // import files and can't access the `window` object.
  .get('/js/sw/envVars.mjs', async (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.end(`export default ${swEnvVars}`);
  })
  .get('/js/sw/worker.mjs', (req, res, next) => {
    // Allow for having a SW file in a nested directory, but with a higher scope.
    res.setHeader('service-worker-allowed', '/');
    next();
  })
  .use(...middleware)
  .use((req, res, next) => {
    if (existsSync(PATH__CONFIG)) req.appConfig = JSON.parse(readFileSync(PATH__CONFIG, 'utf8'));
    next();
  })
  // NOTE: There's mirror logic for API routes in the SW
  .post(ROUTE__API__CONFIG__CREATE, jsonParser, createConfig)
  .post(ROUTE__API__USER__PROFILE__CREATE, jsonParser, createUserProfile)
  .post(ROUTE__API__USER__PROFILE__DELETE, jsonParser, deleteUserProfile)
  .post(ROUTE__API__USER__DATA__GET, jsonParser, getUserData)
  .post(ROUTE__API__USER__PROFILE__GET, jsonParser, getUserProfile)
  .post(ROUTE__API__USER__LOGIN, jsonParser, userLogin)
  .post(ROUTE__API__USER__DATA__SET, jsonParser, setUserData)
  .post(ROUTE__API__USER__PROFILE__SET, jsonParser, setUserProfile)
  .get('/', async (req, res) => {
    const MANIFEST_PATH = '../public/manifest.json';
    const VIEW = 'app'; // usually tied to the `entry` name in your bundler
    if (process.env.NODE_ENV !== 'production') delete require.cache[require.resolve(MANIFEST_PATH)];
    const manifest = require(MANIFEST_PATH);
    
    const body = {
      asyncScripts: [ // only needed for SW
        ...langFiles,
      ],
      asyncStyles: [ // only needed for SW
        ...themeFiles,
      ],
      scripts: [
        `/${PUBLIC_JS_VENDOR}/marked.min.js`,
        `/${PUBLIC_JS_VENDOR}/prism/prism-core.min.js`,
        `/${PUBLIC_JS_VENDOR}/prism/plugins/prism-line-numbers.min.js`,
        `/${PUBLIC_JS_VENDOR}/prism/plugins/prism-toolbar.min.js`,
        `/${PUBLIC_JS_VENDOR}/prism/plugins/prism-copy-to-clipboard.min.js`,
        manifest['vendor.mjs'],
        manifest['sw.register.mjs'],
        manifest[`${VIEW}.mjs`],
      ],
      styles: [
        { attrs: { id: 'prismTheme' }, url: `/${PUBLIC_CSS_VENDOR}/prism/themes/prism.min.css` },
        `/${PUBLIC_CSS_VENDOR}/prism/plugins/prism-line-numbers.min.css`,
        `/${PUBLIC_CSS_VENDOR}/prism/plugins/prism-toolbar.min.css`,
      ],
    };
    const head = {
      scripts: [],
      styles: [
        manifest[`${VIEW}.css`],
      ],
    };
    
    res.end(shell({
      body,
      head,
      props: {
        appTitle: APP__TITLE,
        configExists: !!req.appConfig,
      },
      swEnvVars,
    }));
  });

let httpModule;
let protocol = 'http';
let serverOpts = {};
if (process.env.NODE_EXTRA_CA_CERTS) {
  serverOpts.cert = readFileSync(process.env.NODE_EXTRA_CA_CERTS, 'utf8');
  serverOpts.key = readFileSync(process.env.NODE_EXTRA_CA_CERTS.replace('.crt', '.key'), 'utf8');
  httpModule = require('https');
  protocol = 'https';
}
else httpModule = require('http');

const server = httpModule.createServer(serverOpts, app);

server.listen(SERVER__PORT, err => {
  if (err) log.error('Error', err);
  log.info(`Server running at: ${protocol}://localhost:${SERVER__PORT}`);
});
