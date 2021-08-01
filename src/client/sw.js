const CACHE_KEY = 'notes-app';
const LOG_PREFIX = '[SW]';
const channel = new BroadcastChannel('sw-messages');

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
