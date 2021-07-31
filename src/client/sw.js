const CACHE_KEY = 'notes-app';
const LOG_PREFIX = '[SW]';

// async function sendClientMsg(ev, msg) {
//   const { source } = ev;
// 
//   if (source) {
//     source.postMessage(msg);
//   }
//   else {
//     console.warn(`${LOG_PREFIX} No event 'source' found, not sending message`);
//   }
// }

self.addEventListener('install', async () => {
  await self.skipWaiting();
  console.log(`${LOG_PREFIX} Installed`);
});

self.addEventListener('activate', async () => {
  await self.clients.claim();
  console.log(`${LOG_PREFIX} Actived`);
});

self.addEventListener('fetch', (ev) => {
  const { request } = ev;
  
  ev.respondWith(
    caches.match(request).then((resp) => {
      if (!navigator.onLine && resp) {
        console.log(`${LOG_PREFIX} From Cache: "${request.url}"`);
        return resp;
      }
      
      console.log(`${LOG_PREFIX} Fetching: "${request.url}"`);
      return fetch(request);
    })
  );
});

self.addEventListener('message', async (ev) => {
  const { data: { step, type, urls } } = ev;
  
  switch (type) {
    case 'CACHE_URLS': {
      if (step === 'installing') await caches.delete(CACHE_KEY);
      
      const cache = await caches.open(CACHE_KEY);
      cache.addAll(urls);
      
      console.log(`${LOG_PREFIX} Cached URLs:\n${urls.map(url => `  ${url}`).join('\n')}`);
      // sendClientMsg(ev, `Cached URLs:\n${urls.map(url => `  ${url}`).join('\n')}`);
      break;
    }
  }
});
