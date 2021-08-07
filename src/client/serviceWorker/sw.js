import { DB_VERSION } from './constants.js';
import {
  base64ToBuffer,
  decrypt,
  encrypt,
} from './crypt.js';
import { initDB } from './db.js';

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
          // TODO: keep track of all operations
          // - Added/Edited/Deleted groups
          // - Added/Edited/Deleted notes
          // 
          // ---------------------------------------
          // Group
          // ---------------------------------------
          // [New]
          // http://localhost:3001/api/user/data/set
          // action: "add"
          // name: "newgroup"
          // password: "<PASSWORD>"
          // path: "root"
          // type: "group"
          // username: "<USERNAME>"
          // 
          // [Edit]
          // http://localhost:3001/api/user/data/set
          // action: "edit"
          // name: "newgroupz"
          // oldName: "newgroup"
          // password: "<PASSWORD>"
          // path: "root"
          // type: "group"
          // username: "<USERNAME>"
          // 
          // [Delete]
          // http://localhost:3001/api/user/data/set
          // action: "delete"
          // id: "newgroupz"
          // password: "<PASSWORD>"
          // path: "root"
          // type: "group"
          // username: "<USERNAME>"
          // 
          // ---------------------------------------
          // Note
          // ---------------------------------------
          // [New]
          // http://localhost:3001/api/user/data/set
          // action: "add"
          // content: ""
          // password: "<PASSWORD>"
          // path: "root"
          // title: "blah"
          // type: "note"
          // username: "<USERNAME>"
          // 
          // [Edit]
          // http://localhost:3001/api/user/data/set
          // action: "edit"
          // content: "aasdfsd"
          // oldTitle: "blah"
          // password: "<PASSWORD>"
          // path: "root"
          // title: "blah"
          // type: "note"
          // username: "<USERNAME>"
          // 
          // [Delete]
          // http://localhost:3001/api/user/data/set
          // action: "delete"
          // id: "blah"
          // password: "<PASSWORD>"
          // path: "root"
          // type: "note"
          // username: "<USERNAME>"
          
          try {
            const { password, username } = reqBody;
            const encryptedUsername = await encrypt(cryptData, username, password);
            const encryptedOfflineUserData = await dbAPI.selectStore('offlineUserData').get(encryptedUsername, false);
            let rawData = {};
            
            if (encryptedOfflineUserData) {
              rawData = JSON.parse(await decrypt(cryptData, encryptedOfflineUserData.data, password));
            }
            else {
              const encryptedUserData = await dbAPI.selectStore('userData').get(encryptedUsername, false);
              if (encryptedUserData) {
                rawData = JSON.parse(await decrypt(cryptData, encryptedUserData.data, password));
              }
            }
            
            // TODO
            // - duplicate all the Server logic? Think I may have to instead
            //   create a WP entry for a SW
            //   - then just import/require items like I normally would
            //   - stop loading the SW as a module
            //   - move the serviceWorker folder to the root of `src` for easy
            //     access to client, server, and utils folders
            //   - remove watcher and prep-dist logic for SW files
            // - create shareable utils for the Server and SW to deal with
            //   adding, editing, and deleting groups/notes.
            // - benefit of a WP bundle, is that the SW will update when it's
            //   dependencies are changed
            
            // const jsonData = JSON.stringify(userData);
            // const encryptedData = await encrypt(cryptData, jsonData, password);
            // 
            // await dbAPI.selectStore('userData').set({
            //   data: encryptedData,
            //   username: encryptedUsername,
            // });
            
            
            return genResponse(200, rawData);
          }
          catch (err) {
            return genResponse(404, { message: `${OFFLINE_PREFIX} Error for Offline User data:\n${err}` });
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
          else if (
            reqURL.endsWith('user/data')
            || reqURL.endsWith('user/data/set')
          ) {
            try {
              const { password, username } = await reqBody;
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

channel.addEventListener('message', async (ev) => {
  const { data: { creds, step, type, urls } } = ev;
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
    case 'GET_OFFLINE_CHANGES': {
      const { password, username } = creds;
      const encryptedUsername = await encrypt(cryptData, username, password);
      const offlineData = await dbAPI.selectStore('offlineUserData').get(encryptedUsername, true);
      let decryptedData;
      
      if (offlineData) {
        decryptedData = JSON.parse(await decrypt(cryptData, offlineData.data, password));
      }
      
      channel.postMessage({
        data: decryptedData,
        type: 'offlineData',
      });
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
