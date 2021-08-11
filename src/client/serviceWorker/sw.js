import {
  SW__CHANNEL__INIT_API_DATA,
  SW__CHANNEL__MESSAGES,
  SW__CHANNEL__OFFLINE_DATA,
} from '../../constants';
import modifyUserData from '../../utils/modifyUserData';
import { DB_VERSION } from './constants';
import {
  base64ToBuffer,
  decrypt,
  encrypt,
} from './crypt';
import { initDB } from './db';

const CACHE_KEY = 'notes-app';
const LOG_PREFIX = '[SW]';
const channel = { 
  apiData: new BroadcastChannel(SW__CHANNEL__INIT_API_DATA),
  msgs: new BroadcastChannel(SW__CHANNEL__MESSAGES),
  offlineData: new BroadcastChannel(SW__CHANNEL__OFFLINE_DATA),
};
let dbAPI;
let cryptData;

function genResponse(status, data = {}) {
  const blob = new Blob([
    JSON.stringify(data, null, 2)],
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
function _fetch(req, ev, cb) {
  const fp = new Promise((resolve, reject) => {
    if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;
    
    const f = fetch(req);
    
    if (cb) f.then(resp => {
      return cb(resp.clone());
    });
    
    f.then(resolve).catch(err => {
      console.error(`${LOG_PREFIX} Error fetching "${req.url}"\n${err}`);
      reject(err);
    });
  });
  
  ev.waitUntil(fp);
  
  return fp;
}

async function setUserInfo(creds) {
  try {
    const _creds = Promise.resolve(creds); // allow for a Promise or an Object to be passed in
    const { password, username } = await _creds;
    const encryptedUsername = await encrypt(cryptData, username, password);
    
    await dbAPI.selectStore('users').set({ username: encryptedUsername });
    console.log(`${LOG_PREFIX} Saved login info`);
  }
  catch (err) {
    console.error(`${LOG_PREFIX} Error saving login info\n${err}`);
  }
}

self.addEventListener('install', () => {
  self.skipWaiting();
  channel.msgs.postMessage({ status: 'installing' });
});

self.addEventListener('activate', async () => {
  try {
    await self.clients.claim();
    channel.msgs.postMessage({ status: 'activated' });
  }
  catch (err) {
    console.error(`${LOG_PREFIX} Error activating Service Worker:\n${err}`);
    channel.msgs.postMessage({ status: 'error' });
  }
});

// TODO - may have to send a message with the API routes to keep things in sync

self.addEventListener('fetch', (ev) => {
  const { request } = ev;
  const offline = !navigator.onLine;
  const reqURL = request.url;
  
  if (reqURL.includes('/api')) {
    if (offline) {
      const OFFLINE_PREFIX = '[OFFLINE]';
      
      ev.respondWith(async function() {
        const reqBody = await request.json();
        
        if (reqURL.endsWith('user/login')) {
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
        else if (reqURL.endsWith('user/data/set')) {
          try {
            const { password, username } = reqBody;
            const encryptedUsername = await encrypt(cryptData, username, password);
            const { data, error, logMsg } = await modifyUserData({
              loadCurrentData: async () => {
                const encryptedUserData = await dbAPI.selectStore('userData').get(encryptedUsername, true);
                return (encryptedUserData)
                  ? JSON.parse(await decrypt(cryptData, encryptedUserData.data, password))
                  : {};
              },
              logMsg: `${LOG_PREFIX}${OFFLINE_PREFIX} User data modified`,
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
            
            console.log(`${LOG_PREFIX}${OFFLINE_PREFIX} ${logMsg}`);
            return genResponse(200, data);
          }
          catch (err) {
            return genResponse(404, { message: `${LOG_PREFIX}${OFFLINE_PREFIX} Error modifying User data:\n${err}` });
          }
        }
        else if (reqURL.endsWith('user/data')) {
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
        _fetch(request, ev, async (data) => {
          if (reqURL.endsWith('user/login')) {
            await setUserInfo(data.json());
          }
          else if (
            reqURL.endsWith('user/data')
            || reqURL.endsWith('user/data/set')
          ) {
            try {
              const { offlineChangesExist, password, username } = await reqBody;
              const encryptedUsername = await encrypt(cryptData, username, password);
              const userData = await data.json();
              
              if (userData) {
                if (offlineChangesExist) {
                  console.log(`${LOG_PREFIX} Offline changes exist, skipping save of User data`);
                }
                else {
                  const jsonData = JSON.stringify(userData);
                  const encryptedData = await encrypt(cryptData, jsonData, password);
                  
                  await dbAPI.selectStore('userData').set({
                    data: encryptedData,
                    username: encryptedUsername,
                  });
                  console.log(`${LOG_PREFIX} Saved User data`);
                }
              }
              else {
                console.warn(`${LOG_PREFIX} No User data returned`);
              }
            }
            catch (err) {
              console.error(`${LOG_PREFIX} Error saving User data\n${err}`);
            }
          }
        })
      );
    }
  }
  else {
    ev.respondWith(
      caches.match(request).then((resp) => {
        if (offline) {
          if (resp) {
            console.log(`${LOG_PREFIX} From Cache: "${reqURL}"`);
            return resp;
          }
          else if (reqURL.includes('browser-sync')) return;
        }
        
        console.log(`${LOG_PREFIX} Fetching: "${reqURL}"`);
        return _fetch(request, ev);
      })
    );
  }
});

channel.msgs.addEventListener('message', async (ev) => {
  const { data: { step, type, urls } } = ev;
  const online = navigator.onLine;
  
  switch (type) {
    case 'CACHE_URLS': {
      if (online) {
        if (step === 'installing') await caches.delete(CACHE_KEY);
        
        const cache = await caches.open(CACHE_KEY);
        const deDupedURLs = urls.reduce((arr, url) => {
          if (!arr.includes(url)) arr.push(url);
          return arr;
        }, []);
        cache.addAll(deDupedURLs);
        
        console.log(`${LOG_PREFIX} Cached URLs:\n${deDupedURLs.map(url => `  ${url}`).join('\n')}`);
      }
      break;
    }
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
      const errMsg = `${LOG_PREFIX} Error initializing API data:\n${err}`;
      console.error(errMsg);
      channel.apiData.postMessage({ error: { message: errMsg } });
    }
  }
});

channel.offlineData.addEventListener('message', async (ev) => {
  const { password, username } = ev.data.creds;
  const encryptedUsername = await encrypt(cryptData, username, password);
  const userData = await dbAPI.selectStore('userData').get(encryptedUsername, true);
  let data;
  
  if (userData && userData.offlineUpdates) {
    data = JSON.parse(await decrypt(cryptData, userData.data, password));
  }
  
  channel.offlineData.postMessage({ data });
});
