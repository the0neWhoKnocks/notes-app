window.sw = window.sw || {};
window.sw = {
  ...window.sw,
  messageQueue: [],
  postMessage: (opts) => {
    window.sw.messageQueue.push(opts);
  },
};

if ('serviceWorker' in navigator) {
  const {
    EVENT__SERVICE_WORKER__ACTIVATED,
    EVENT__SERVICE_WORKER__ERROR,
    EVENT__SERVICE_WORKER__INSTALLING,
  } = require('../constants');
  
  window.addEventListener('load', () => {
    const LOG_PREFIX = '[SW_REGISTER]';
    
    const channel = new BroadcastChannel('sw-messages');
    channel.addEventListener('message', ({ data }) => {
      console.log(`${LOG_PREFIX} Status: ${data.status}`);
      
      switch (data.status) {
        case 'activated': {
          window.dispatchEvent(new Event(EVENT__SERVICE_WORKER__ACTIVATED));
          break;
        }
        case 'error': {
          window.dispatchEvent(new Event(EVENT__SERVICE_WORKER__ERROR));
          break;
        }
        case 'installing': {
          channel.postMessage({
            step: 'installing',
            type: 'CACHE_URLS',
            urls: window.sw.assetsToCache,
          });
          window.dispatchEvent(new Event(EVENT__SERVICE_WORKER__INSTALLING));
          break;
        }
      }
    });
    
    navigator.serviceWorker.register('/sw.js', { type: 'module' })
      .then(() => {
        channel.postMessage({ type: 'INIT_API_DATA' });
        console.log(`${LOG_PREFIX} Registered`);
      })
      .catch(err => console.log(`${LOG_PREFIX} Registration failed:\n${err.stack}`));
    
    navigator.serviceWorker.ready.then(() => {
      window.sw.postMessage = channel.postMessage.bind(channel);
      if (window.sw.messageQueue.length) {
        window.sw.messageQueue.forEach(msg => window.sw.postMessage(msg));
      }
    });
  });
}
