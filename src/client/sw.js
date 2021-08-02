import { DB_VERSION } from '/serviceWorker/constants.js';
import {
  base64ToBuffer,
  encrypt,
} from '/serviceWorker/crypt.js';
import { getDB } from '/serviceWorker/db.js';

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
    dbAPI = await getDB();
    const { iv, salt } = await dbAPI.selectStore('crypt').get(DB_VERSION);
    cryptData = {
      iv: base64ToBuffer(iv),
      salt: base64ToBuffer(salt),
    };
    channel.postMessage({ status: 'activated' });
  }
  catch (err) {
    console.error(`${LOG_PREFIX} Error activating Service Worker:\n${err}`);
    channel.postMessage({ status: 'error' });
  }
});

// TODO - may have to send a message with the API routes to keep things in sync

self.addEventListener('fetch', (ev) => {
  const { request } = ev;
  const offline = !navigator.onLine;
  
  if (request.url.includes('/api')) {
    if (offline) {
      ev.respondWith(async function() {
        const reqBody = await request.json();
        
        if (request.url.includes('user/login')) {
          const { password, username } = reqBody;
          const encryptedUsername = await encrypt(cryptData, username, password);
          
          await dbAPI.selectStore('users');
          const userExists = await dbAPI.get(encryptedUsername);
          if (userExists) {
            return genResponse(200, reqBody);
            // console.log(await decrypt(cryptData, encryptedUsername, password));
          }
          
          return genResponse(404, { message: "Looks like you haven't logged in while on this device.\nNo offline data available." });
        }
        
        return genResponse(404, { message: `No offline data found for "${request.url}"` });
      }());
    }
    else {
      return _fetch(request, async (data) => {
        if (request.url.includes('user/login')) {
          const { password, username } = await data.json();
          
          try {
            const encryptedUsername = await encrypt(cryptData, username, password);
            
            await dbAPI.selectStore('users');
            const userExists = await dbAPI.get(encryptedUsername);
            if (!userExists) await dbAPI.set({ username: encryptedUsername });
          }
          catch (err) {
            console.error(`${LOG_PREFIX} Error saving login info\n${err}`);
          }
        }
      });
    }
  }
  else {
    ev.respondWith(
      caches.match(request).then((resp) => {
        if (offline && resp) {
          console.log(`${LOG_PREFIX} From Cache: "${request.url}"`);
          return resp;
        }
        
        console.log(`${LOG_PREFIX} Fetching: "${request.url}"`);
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
        cache.addAll(urls);
        
        console.log(`${LOG_PREFIX} Cached URLs:\n${urls.map(url => `  ${url}`).join('\n')}`);
        // sendClientMsg(ev, `Cached URLs:\n${urls.map(url => `  ${url}`).join('\n')}`);
      }
      break;
    }
  }
});
