import { DB_VERSION } from '/serviceWorker/constants.js';
import {
  base64ToBuffer,
  decrypt,
  encrypt,
} from '/serviceWorker/crypt.js';
import { initDB } from '/serviceWorker/db.js';

const CACHE_KEY = 'notes-app';
const LOG_PREFIX = '[SW]';
const channel = new BroadcastChannel('sw-messages');
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
function _fetch(req, cb) {
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;
  
  let f = fetch(req);
  
  if (cb) f = f.then(cb);
  
  return f.catch(err => {
    console.error(`${LOG_PREFIX} Error fetching "${req.url}"\n${err}`);
  });
}

self.addEventListener('install', () => {
  self.skipWaiting();
  channel.postMessage({ status: 'installing' });
});

self.addEventListener('activate', async () => {
  try {
    await self.clients.claim();
    channel.postMessage({ status: 'activated' });
  }
  catch (err) {
    console.error(`${LOG_PREFIX} Error activating Service Worker:\n${err}`);
    channel.postMessage({ status: 'error' });
  }
});

// TODO - may have to send a message with the API routes to keep things in sync

self.addEventListener('fetch', async (ev) => {
  const { request } = ev;
  const offline = !navigator.onLine;
  const reqURL = request.url;
  
  if (reqURL.includes('/api')) {
    if (offline) {
      const OFFLINE_PREFIX = '[OFFLINE]';
      
      ev.respondWith(async function() {
        const reqBody = await request.json();
        
        if (reqURL.includes('user/login')) {
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
        else if (reqURL.includes('user/data')) {
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
      const reqBody = await request.clone().json();
      
      return _fetch(request, async (data) => {
        if (reqURL.includes('user/login')) {
          try {
            const { password, username } = await data.json();
            const encryptedUsername = await encrypt(cryptData, username, password);
            
            await dbAPI.selectStore('users').set({ username: encryptedUsername });
            console.log(`${LOG_PREFIX} Saved login info`);
          }
          catch (err) {
            console.error(`${LOG_PREFIX} Error saving login info\n${err}`);
          }
        }
        else if (reqURL.includes('user/data')) {
          try {
            const { password, username } = reqBody;
            const encryptedUsername = await encrypt(cryptData, username, password);
            const userData = await data.json();
            
            if (userData) {
              const jsonData = JSON.stringify(userData);
              const encryptedData = await encrypt(cryptData, jsonData, password);
              
              await dbAPI.selectStore('userData').set({
                data: encryptedData,
                username: encryptedUsername,
              });
              console.log(`${LOG_PREFIX} Saved User data`);
            }
            else {
              console.warn(`${LOG_PREFIX} No User data returned`);
            }
          }
          catch (err) {
            console.error(`${LOG_PREFIX} Error saving User data\n${err}`);
          }
        }
      });
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
        return _fetch(request);
      })
    );
  }
});

channel.addEventListener('message', async (ev) => {
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
    case 'INIT_API_DATA': {
      try {
        dbAPI = await initDB();
        if (!cryptData) {
          const { iv, salt } = await dbAPI.selectStore('crypt').get(DB_VERSION);
          cryptData = {
            iv: base64ToBuffer(iv),
            salt: base64ToBuffer(salt),
          };
        }
      }
      catch (err) {
        console.error(`${LOG_PREFIX} Error initializing API data:\n${err}`);
        channel.postMessage({ status: 'error' });
      }
      break;
    }
  }
});
