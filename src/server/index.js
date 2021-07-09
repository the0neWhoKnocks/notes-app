const { STATUS_CODES } = require('http');
const { readFileSync, existsSync } = require('fs');
const compression = require('compression');
const sirv = require('sirv');
const bodyParser = require('body-parser');
const mkdirp = require('mkdirp');
const {
  APP__TITLE,
  PATH__CONFIG,
  PATH__DATA,
  PATH__PUBLIC,
  ROUTE__API__CONFIG_CREATE,
  ROUTE__API__HELLO,
  ROUTE__API__USER_CREATE,
  ROUTE__API__USER_GET_DATA,
  ROUTE__API__USER_GET_PROFILE,
  ROUTE__API__USER_LOGIN,
  ROUTE__API__USER_SET_DATA,
  ROUTE__API__USER_SET_PROFILE,
  SERVER__PORT,
} = require('../constants');
const log = require('../utils/logger')('server');
const createConfig = require('./api/config.create');
const createUser = require('./api/user.create');
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

function app(req, res) {
  const [url] = req.url.split('?');
  const handlers = [...app.reqHandlers.middleware];
  const pathHandlers = app.reqHandlers.methods[req.method][url];
  let funcNdx = 0;
  
  if (pathHandlers) handlers.push(...pathHandlers);
  handlers.push(app.notFoundHandler);
  
  const next = () => {
    if (handlers[funcNdx]) {
      funcNdx++;
      handlers[funcNdx-1](req, res, next);
    }
  };
  
  next();
}
app.reqHandlers = {
  methods: {
    GET: {},
    POST: {},
  },
  middleware: [],
};
app.pathHandler = (method) => function pathHandler(path, ...handlers) {
  app.reqHandlers.methods[method][path] = handlers;
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
app.use = function use(...middleware) {
  if (middleware.length) app.reqHandlers.middleware.push(...middleware);
  return app;
};
const jsonParser = bodyParser.json();

if (!existsSync(PATH__DATA)) mkdirp.sync(PATH__DATA);

app
  .use((req, res, next) => {
    if (!res.error) {
      res.error = (statusCode, error) => {
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
  .use(...middleware)
  .use((req, res, next) => {
    if (existsSync(PATH__CONFIG)) req.appConfig = JSON.parse(readFileSync(PATH__CONFIG, 'utf8'));
    next();
  })
  .post(ROUTE__API__CONFIG_CREATE, jsonParser, createConfig)
  .post(ROUTE__API__USER_GET_DATA, jsonParser, getUserData)
  .post(ROUTE__API__USER_GET_PROFILE, jsonParser, getUserProfile)
  .post(ROUTE__API__USER_CREATE, jsonParser, createUser)
  .post(ROUTE__API__USER_LOGIN, jsonParser, userLogin)
  .post(ROUTE__API__USER_SET_DATA, jsonParser, setUserData)
  .post(ROUTE__API__USER_SET_PROFILE, jsonParser, setUserProfile)
  .get(ROUTE__API__HELLO, (req, res) => {
    const { parse: parseQuery } = require('querystring');
    const { parse: parseURL } = require('url');
    const params = { ...parseQuery(parseURL(req.url).query) };
    log.info(`[API] Recieved params: ${JSON.stringify(params)}`);
    res.json({ hello: 'dave' });
  })
  .get('/', (req, res) => {
    res.end(shell({
      props: {
        appTitle: APP__TITLE,
        configExists: !!req.appConfig,
      },
      view: 'app', // usually tied to the `entry` name in your bundler
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
