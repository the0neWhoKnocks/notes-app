const CACHE_KEY = 'notes-app';

async function sendClientMsg(ev, msg) {
  const { source } = ev;
  
  if (source) {
    source.postMessage(msg);
    return;
  }
  else {
    console.warn('No event `source` found, not sending message');
    return;
  }
}

self.addEventListener('install', async () => {
  await self.skipWaiting();
});

self.addEventListener('message', async (ev) => {
  const { data: { step, type, urls } } = ev;
  
  if (type === 'CACHE_URLS') {
    if (step === 'install') await caches.delete(CACHE_KEY);
    
    const cache = await caches.open(CACHE_KEY);
    cache.addAll(urls);
    
    sendClientMsg(ev, `Cached URLs:\n${urls.map(url => `  ${url}`).join('\n')}`);
  }
});

