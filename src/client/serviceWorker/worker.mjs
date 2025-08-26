// NOTE: imports will be relative to the nested folder in dist/public/js

import envVars from '/js/sw/envVars.mjs';
import genAPIPayload, { EP__SET__USER_DATA } from './genAPIPayload.mjs';
import modifyUserData from './modifyUserData.mjs';
import {
  API_PREFIX,
  CACHE_KEY,
  CHANNEL__INIT_API_DATA,
  CHANNEL__INSTALL_CHECK,
  CHANNEL__MESSAGES,
  CHANNEL__OFFLINE_DATA,
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
function _fetch(req, offline, ev, cb) {
  const fp = new Promise((resolve, reject) => {
    if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;
    
    const f = fetch(req);
    
    if (cb) f.then(resp => {
      return cb(resp.clone());
    });
    
    f.then(resolve).catch(err => {
      if (!isIgnoredOffline(req.url, offline)) {
        log.error(`Error fetching "${req.url}"\n${err}`);
      }
      
      reject(err);
    });
  });
  
  ev.waitUntil(fp);
  
  return fp;
}

async function setUserInfo(creds) {
  try {
    if (cryptData) {
      const _creds = Promise.resolve(creds); // allow for a Promise or an Object to be passed in
      const { password, username } = await _creds;
      const encryptedUsername = await encrypt(cryptData, username, password);
      
      await dbAPI.selectStore('users').set({ username: encryptedUsername });
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
  const offline = !navigator.onLine;
  const reqURL = request.url;
  
  try {
    if (reqURL.includes(API_PREFIX)) {
      if (cryptData) {
        if (offline) {
          const OFFLINE_PREFIX = '[OFFLINE]';
          
          ev.respondWith(async function () {
            const reqBody = await request.json();
            
            if (reqURL.endsWith(ROUTE__API__USER__LOGIN)) {
              try {
                const { password, username } = reqBody;
                const encryptedUsername = await encrypt(cryptData, username, password);
                
                await dbAPI.selectStore('users').get(encryptedUsername);
                return genResponse(200, reqBody);
              }
              catch (err) {
                return genResponse(404, { message: `${OFFLINE_PREFIX} Error for login:\n${err}` });
              }
            }
            else if (reqURL.endsWith(ROUTE__API__USER__DATA__SET)) {
              try {
                const { action, password, username, type } = reqBody;
                const encryptedUsername = await encrypt(cryptData, username, password);
                const { data, error, logMsg, nodeId } = await modifyUserData({
                  loadCurrentData: async () => {
                    const encryptedUserData = await dbAPI.selectStore('userData').get(encryptedUsername, true);
                    return (encryptedUserData)
                      ? JSON.parse(await decrypt(cryptData, encryptedUserData.data, password))
                      : {};
                  },
                  logMsg: `${OFFLINE_PREFIX} User data modified`,
                  reqBody,
                });
                
                if (error) {
                  const { code, msg } = error;
                  return genResponse(code, msg);
                }
                
                const jsonData = JSON.stringify(data);
                const encryptedData = await encrypt(cryptData, jsonData, password);
                await dbAPI.selectStore('userData').set({
                  data: encryptedData,
                  offlineUpdates: true,
                  username: encryptedUsername,
                });
                
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
                const { password, username } = reqBody;
                const encryptedUsername = await encrypt(cryptData, username, password);
                const { data: userData } = await dbAPI.selectStore('userData').get(encryptedUsername);
                const decryptedData = JSON.parse(await decrypt(cryptData, userData, password));
                return genResponse(200, decryptedData);
              }
              catch (err) {
                return genResponse(404, { message: `${OFFLINE_PREFIX} Error for User data:\n${err}` });
              }
            }
            
            return genResponse(404, { message: `${OFFLINE_PREFIX} No data found for "${reqURL}"` });
          }());
        }
        else {
          const reqBody = request.clone().json();
          
          return ev.respondWith(
            _fetch(request, offline, ev, async (data) => {
              // only save good data
              if (data.status < 400) {
                if (reqURL.endsWith(ROUTE__API__USER__LOGIN)) {
                  await setUserInfo(data.json());
                }
                else if (
                  reqURL.endsWith(ROUTE__API__USER__DATA__GET)
                  || reqURL.endsWith(ROUTE__API__USER__DATA__SET)
                ) {
                  try {
                    const {
                      offlineChangesExist,
                      password,
                      username,
                    } = await reqBody;
                    const encryptedUsername = await encrypt(cryptData, username, password);
                    const userData = await data.json();
                    
                    if (userData) {
                      if (offlineChangesExist) {
                        log.info('Offline changes exist, skipping save of User data');
                      }
                      else {
                        const jsonData = JSON.stringify(userData);
                        const encryptedData = await encrypt(cryptData, jsonData, password);
                        
                        await dbAPI.selectStore('userData').set({
                          data: encryptedData,
                          username: encryptedUsername,
                        });
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
            })
          );
        }
      }
      else {
        log.warn('Missing `cryptData`, skipping API fetch.');
      }
    }
    else {
      if (offline) {
        ev.respondWith((async () => {
          const cachedResp = await caches.match(request);
        
          if (cachedResp) {
            log.debug(`From Cache: "${reqURL}"`);
            return cachedResp;
          }
          else if (isIgnoredOffline(reqURL, offline)) {
            log.debug(`Mock Response: "${reqURL}"`);
            return new Response('', { status: 200 });
          }
        })());
      }
      else {
        log.debug(`Fetching: "${reqURL}"`);
        ev.respondWith(_fetch(request, offline, ev));
      }
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
        const { iv, salt } = await dbAPI.selectStore('crypt').get(DB_VERSION);
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
    const encryptedUsername = await encrypt(cryptData, username, password);
    const userData = await dbAPI.selectStore('userData').get(encryptedUsername, true);
    let data;
    
    switch (type) {
      case MSG_TYPE__CLEAR_OFFLINE_DATA: {
        if (userData?.offlineUpdates) {
          delete userData.offlineUpdates;
          await dbAPI.selectStore('userData').set(userData);
        }
        break;
      }
      case MSG_TYPE__GET_OFFLINE_DATA: {
        if (userData?.offlineUpdates) {
          data = JSON.parse(await decrypt(cryptData, userData.data, password));
        }
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
