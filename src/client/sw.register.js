window.sw = window.sw || {};
window.sw = {
  ...window.sw,
  messageQueue: [],
  postMessage: (opts) => {
    window.sw.messageQueue.push(opts);
  },
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const LOG_PREFIX = '[SW.REGISTER]';
    
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        if (reg.installing) { // only available during install
          console.log(`${LOG_PREFIX} Installing`);
    
          reg.installing.postMessage({
            step: 'installing',
            type: 'CACHE_URLS',
            urls: window.sw.assetsToCache,
          });
        }
    
        console.log(`${LOG_PREFIX} Registered`);
      })
      .catch(err => console.log(`${LOG_PREFIX} Registration failed:\n${err.stack}`));
    
    navigator.serviceWorker.addEventListener('message', ({ data }) => {
      console.log(`${LOG_PREFIX} Message recieved from SW\n`, data);
    });
    
    navigator.serviceWorker.ready.then(reg => {
      window.sw.postMessage = reg.active.postMessage.bind(reg.active);
      if (window.sw.messageQueue.length) {
        window.sw.messageQueue.forEach(msg => window.sw.postMessage(msg));
      }
    });
  });
}
