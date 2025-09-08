// NOTE: imports will be relative to the nested folder in dist/public/js

import envVars from '/js/sw/envVars.mjs';
import genAPIPayload, { EP__SET__USER_DATA } from './genAPIPayload.mjs';
import modifyUserData, {
  formatDataTypes,
  loadDefaultData,
  loadExistingData,
} from './modifyUserData.mjs';
import {
  API_PREFIX,
  CACHE_KEY,
  CHANNEL__INIT_API_DATA,
  CHANNEL__INSTALL_CHECK,
  CHANNEL__MESSAGES,
  CHANNEL__OFFLINE_DATA,
  DATA_KEY__NOTES,
  DATA_KEY__PREFS,
  DATA_TYPE__ALL,
  DB__STORE_NAME__CRYPT,
  DB__STORE_NAME__NOTES,
  DB__STORE_NAME__PREFS,
  DB__STORE_NAME__USERS,
  DB_VERSION,
  MSG_TYPE__CACHE_URLS,
  MSG_TYPE__CLEAR_OFFLINE_DATA,
  MSG_TYPE__GET_OFFLINE_DATA,
  MSG_TYPE__SKIP_WAITING,
  ROUTE__API__USER__DATA__GET,
  ROUTE__API__USER__DATA__SET,
  ROUTE__API__USER__LOGIN,
} from './constants.mjs';
import {
  base64ToBuffer,
  decrypt,
  encrypt,
} from './crypt.mjs';
import { initDB } from './db.mjs';
import l from './logger.mjs';
import swAllowed from './swAllowed.mjs';

const log = l('sw');
const channel = {
  apiData: new BroadcastChannel(CHANNEL__INIT_API_DATA),
  installCheck: new BroadcastChannel(CHANNEL__INSTALL_CHECK),
  msgs: new BroadcastChannel(CHANNEL__MESSAGES),
  offlineData: new BroadcastChannel(CHANNEL__OFFLINE_DATA),
};
const isIgnoredOffline = (url, offline) => offline && !!['/browser-sync'].find((str) => url.includes(str));
let dbAPI;
let cryptData;

function genResponse(status, data = {}) {
  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: 'application/json' }
  );
  // const init = { status: 404, statusText: 'Not Found' };
  const init = { status };
  
  return new Response(blob, init);
}

// NOTE: Wrapping `fetch` for a couple reasons.
// 1. Default `catch` logic for all failed requests.
// 2. Handle odd Chromium bug that only happens when DevTools are open
//    - https://stackoverflow.com/a/49719964/5156659
//    - https://bugs.chromium.org/p/chromium/issues/detail?id=1098389
function _fetch(req, offline, ev, { offlineCb, successCb } = {}) {
  if (offline && offlineCb) return offlineCb();
  
  const tryReq = async () => {
    if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;
    
    try {
      const resp = await fetch(req);
      
      if (successCb) { await successCb(resp.clone()); }
      
      return resp;
    }
    catch (fetchErr) {
      if (
        !isIgnoredOffline(req.url, offline)
        && fetchErr.message !== 'Failed to fetch'
      ) {
        log.error(`Error fetching "${req.url}"\n${fetchErr}`);
      }
      
      // Server may be down, so try to serve up cached results.
      // eslint-disable-next-line no-useless-catch
      try {
        const cachedResp = await offlineCb();
        if (cachedResp) { return cachedResp; }
        // else { throw fetchErr; }
      }
      catch (cacheErr) { throw cacheErr; }
    }
  };
  
  const prom = tryReq();
  ev.waitUntil(prom);
  return prom;
}

async function setUserInfo(creds) {
  try {
    if (cryptData) {
      const { password, username } = creds;
      const encryptedUsername = await encrypt(cryptData, username, password);
      
      await dbAPI.selectStore(DB__STORE_NAME__USERS).set({ username: encryptedUsername });
      log.info('Saved login info');
    }
    else {
      log.warn("Missing `cryptData`, can't set User info.");
    }
  }
  catch (err) {
    log.error(`Error saving login info\n${err}`);
  }
}

async function claimClients() {
  try {
    await self.clients.claim();
    channel.msgs.postMessage({ status: 'activated' });
  }
  catch (err) {
    log.error(`Error activating Service Worker:\n${err}`);
    channel.msgs.postMessage({ status: 'error' });
  }
}

async function killSW() {
  await self.registration.unregister();
  (await self.clients.matchAll()).forEach((client) => {
    if (client.url && client.navigate) {
      log.debug(`Reload Client to finalize SW removal for: ${client.url}`);
      client.navigate(client.url); // reload page to finish removal
    }
  });
}

async function initCheck(claim = false) {
  if (self.initChecked) return self.initChecked;
  
  return self.initChecked = new Promise((resolve) => {
    const ids = new Map();
    const checkHandler = (ev) => {
      const { data: { appId }, origin } = ev;
      ids.set(origin, appId);
    };
    channel.installCheck.addEventListener('message', checkHandler);
    channel.installCheck.postMessage('');
    
    setTimeout(() => {
      channel.installCheck.removeEventListener('message', checkHandler);
      channel.installCheck.close();
      
      const { allowedDomains, appId } = envVars;
      const allowed = (ids.size)
        ? [...ids].every(([ url, id ]) => {
            const { allowed, reason } = swAllowed({
              allowedDomains,
              id1: id,
              id2: appId,
              url,
            });
          
            if (!allowed) log.debug(`Unregister SW because: ${reason}`);
          
            return allowed;
          })
        : false;
      
      if (allowed) {
        if (claim) {
          log.debug('Activate SW for clients');
          claimClients();
        }
      }
      else {
        if (!ids.length) log.debug('No App ids returned from clients, activation will be skipped.');
        else log.debug('SW not allowed');
        killSW();
      }
      
      resolve();
    }, 1000);
  });
}

async function loadUserData(config, username, password, {
  checkForUpdates,
  offline,
  type = DATA_TYPE__ALL,
} = {}) {
  const encryptedUsername = await encrypt(cryptData, username, password);
  let hasUpdates = false;
  
  const loadParse = async (storeName) => {
    const storeData = await dbAPI.selectStore(storeName).get(encryptedUsername, true);
    if (checkForUpdates && storeData.offlineUpdates) hasUpdates = true;
    return JSON.parse(await decrypt(cryptData, storeData.data, password));
  };
  
  const setTypeDefault = async (types, err) => {
    let data;
    
    log.debug(err);
    // TODO Since the DB is initialized on install, I don't think there'll be a
    // similar case in the worker. Leaving this here for reference in case a
    // reason pops up to use it.
    // -------------------------------------------------------------------------
    // if (err.message.includes('ENOENT')) {
    //   data = await saveUserData({ config, offline, password, types, username });
    // }
    return data;
  };
  
  try {
    const data = await loadExistingData({
      config,
      encrypt,
      notes: {
        load: async () => await loadParse(DB__STORE_NAME__NOTES),
        setDefault: setTypeDefault,
      },
      password,
      prefs: {
        load: async () => await loadParse(DB__STORE_NAME__PREFS),
        setDefault: setTypeDefault,
      },
      type,
    });
    
    if (checkForUpdates && hasUpdates) data.hasUpdates = true;
    
    return data;
  }
  catch (err) {
    log.debug(err); // TODO may not need any error reporting here
    
    return await loadDefaultData({
      config,
      encrypt,
      password,
      setDefault: async (types) => { await saveUserData({ config, offline, password, types, username }); },
      type,
    });
  }
}

async function saveUserData({ config, offline, password, types, username } = {}) {
  const encryptedUsername = await encrypt(config, username, password);
  const result = [];
  
  for (let [ type, encryptedData, rawData ] of types) {
    let storeName;
    switch (type) {
      case DATA_KEY__NOTES: storeName = DB__STORE_NAME__NOTES; break;
      case DATA_KEY__PREFS: storeName = DB__STORE_NAME__PREFS; break;
    }
    
    try {
      await dbAPI.selectStore(storeName).set({
        data: encryptedData,
        offlineUpdates: offline,
        username: encryptedUsername,
      });
      result.push(rawData);
    }
    catch (err) {
      const msg = `Error writing data for '${type}' to "${storeName}"\n${err.stack}`;
      log.error(msg);
      throw new Error(msg);
    }
  }
  
  return (result.length === 1) ? result[0] : result;
}

self.addEventListener('install', () => {
  channel.msgs.postMessage({ status: 'installing' });
});

self.addEventListener('activate', async (ev) => {
  log.debug('Start activation check.');
  await ev.waitUntil(initCheck(true));
});

self.addEventListener('fetch', async (ev) => {
  await ev.waitUntil(initCheck());
  
  const { request } = ev;
  const reqURL = request.url;
  
  // NOTE: Sometimes overwritten if the Server is down and an `offlineCb` is
  // called manually.
  let offline = !navigator.onLine;
  
  try {
    if (reqURL.includes(API_PREFIX)) {
      if (cryptData) {
        const req = request.clone();
        
        const offlineCb = async () => {
          const OFFLINE_PREFIX = '[OFFLINE]';
          const reqBody = await req.json();
          offline = true;
          
          if (reqURL.endsWith(ROUTE__API__USER__LOGIN)) {
            try {
              const { password, username } = reqBody;
              const encryptedUsername = await encrypt(cryptData, username, password);
              
              await dbAPI.selectStore(DB__STORE_NAME__USERS).get(encryptedUsername);
              return genResponse(200, reqBody);
            }
            catch (err) {
              return genResponse(404, { message: `${OFFLINE_PREFIX} Error for login:\n${err}` });
            }
          }
          else if (reqURL.endsWith(ROUTE__API__USER__DATA__SET)) {
            try {
              const { action, password, username, type } = reqBody;
              const { data, error, logMsg, nodeId } = await modifyUserData({
                loadCurrentData: async () => {
                  return await loadUserData(cryptData, username, password, { offline, type });
                },
                logMsg: `${OFFLINE_PREFIX} User data modified`,
                reqBody,
              });
              
              if (error) {
                const { code, msg } = error;
                return genResponse(code, msg);
              }
              
              const types = await formatDataTypes(data, type, { config: cryptData, encrypt, password });
              await saveUserData({ config: cryptData, offline, password, types, username });
              
              log.info(`${OFFLINE_PREFIX} ${logMsg}`);
              
              return genResponse(200, genAPIPayload({
                action,
                data,
                endpoint: EP__SET__USER_DATA,
                nodeId,
                nodePath: reqBody.path,
                type,
              }));
            }
            catch (err) {
              return genResponse(404, { message: `${OFFLINE_PREFIX} Error modifying User data:\n${err}` });
            }
          }
          else if (reqURL.endsWith(ROUTE__API__USER__DATA__GET)) {
            try {
              const { password, type, username } = reqBody;
              
              if (!username && !password) return genResponse(400, { message: 'Missing `username` and `password`' });
              else if (!username) return genResponse(400, { message: 'Missing `username`' });
              else if (!password) return genResponse(400, { message: 'Missing `password`' });
              
              const data = await loadUserData(cryptData, username, password, { offline, type });
              
              log.info('Got data');
              return genResponse(200, data);
            }
            catch (err) {
              return genResponse(404, { message: `${OFFLINE_PREFIX} Error for User data:\n${err}` });
            }
          }
          
          return genResponse(404, { message: `${OFFLINE_PREFIX} No data found for "${reqURL}"` });
        };
        
        const successCb = async (data) => {
          const reqBody = await req.json();
          
          // only save good data
          if (data.status < 400) {
            if (reqURL.endsWith(ROUTE__API__USER__LOGIN)) {
              const creds = await data.json();
              await setUserInfo(creds);
            }
            else if (
              reqURL.endsWith(ROUTE__API__USER__DATA__GET)
              || reqURL.endsWith(ROUTE__API__USER__DATA__SET)
            ) {
              try {
                const {
                  offlineChangesExist,
                  password,
                  type,
                  username,
                } = reqBody;
                const userData = await data.json();
                
                if (userData) {
                  if (offlineChangesExist) {
                    log.info('Offline changes exist, skipping save of User data');
                  }
                  else {
                    const types = await formatDataTypes(userData, type, { config: cryptData, encrypt, password });
                    await saveUserData({ config: cryptData, offline, password, types, username });
                    log.info('Cached User data');
                  }
                }
                else {
                  log.warn('No User data returned');
                }
              }
              catch (err) {
                log.error(`Error saving User data\n${err}`);
              }
            }
          }
          else {
            log.info('Skipping save, error response recieved');
          }
          
          return data;
        };
        
        return ev.respondWith(
          _fetch(request, offline, ev, { offlineCb, successCb })
        );
      }
      else {
        log.warn('Missing `cryptData`, skipping API fetch.');
      }
    }
    else {
      const offlineCb = async () => {
        offline = true;
        
        const cachedResp = await caches.match(request);
        
        if (cachedResp) {
          log.debug(`From Cache: "${reqURL}"`);
          return cachedResp;
        }
        else if (isIgnoredOffline(reqURL, offline)) {
          log.debug(`Mock Response: "${reqURL}"`);
          return new Response('', { status: 200 });
        }
      };
      
      log.debug(`Fetching: "${reqURL}"`);
      ev.respondWith(_fetch(request, offline, ev, { offlineCb }));
    }
  }
  catch (err) {
    log.error('Problem fetching:\n', err.stack);
  }
});

channel.apiData.addEventListener('message', async (ev) => {
  const { data: { creds, error, status } } = ev;
  
  if (!error && !status) {
    try {
      dbAPI = await initDB();
      
      if (!cryptData) {
        const { iv, salt } = await dbAPI.selectStore(DB__STORE_NAME__CRYPT).get(DB_VERSION);
        cryptData = {
          iv: base64ToBuffer(iv),
          salt: base64ToBuffer(salt),
        };
      }
      
      if (creds) await setUserInfo(creds);
      
      channel.apiData.postMessage({ status: 'initialized' });
    }
    catch (err) {
      const errMsg = `Error initializing API data:\n${err}`;
      log.error(errMsg);
      channel.apiData.postMessage({ error: { message: errMsg } });
    }
  }
});

channel.msgs.addEventListener('message', async (ev) => {
  const { data: { step, type, urls } } = ev;
  const online = navigator.onLine;
  
  log.debug(`Message type: ${type}`);
  
  switch (type) {
    case MSG_TYPE__CACHE_URLS: {
      if (online) {
        if (step === 'installing') await caches.delete(CACHE_KEY);
        
        const cache = await caches.open(CACHE_KEY);
        const deDupedURLs = urls.reduce((arr, url) => {
          if (!arr.includes(url)) arr.push(url);
          return arr;
        }, []);
        cache.addAll(deDupedURLs);
        
        log.info(`Cached URLs:\n${deDupedURLs.map(url => `  ${url}`).join('\n')}`);
      }
      break;
    }
    case MSG_TYPE__SKIP_WAITING: return self.skipWaiting();
    default: {
      log.warn('Unhandled message:', ev.data);
    }
  }
});

channel.offlineData.addEventListener('message', async (ev) => {
  if (cryptData && ev.data?.creds) {
    const { creds, type } = ev.data;
    const { password, username } = creds;
    const userData = await loadUserData(cryptData, username, password, { checkForUpdates: true });
    let data;
    
    switch (type) {
      case MSG_TYPE__CLEAR_OFFLINE_DATA: {
        if (userData?.hasUpdates) {
          delete userData.hasUpdates;
          const types = await formatDataTypes(userData, DATA_TYPE__ALL, { config: cryptData, encrypt, password });
          await saveUserData({ config: cryptData, password, types, username });
        }
        break;
      }
      case MSG_TYPE__GET_OFFLINE_DATA: {
        if (userData?.hasUpdates) { data = userData; }
        break;
      }
    }
    
    channel.offlineData.postMessage(data);
  }
  else {
    if (!cryptData) log.warn("Missing `cryptData`, can't check for offline data");
    else if (!ev.data?.creds) log.warn("Missing User credentials, can't check for offline data");
  }
});
