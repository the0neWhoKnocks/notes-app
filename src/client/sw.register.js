window.sw = {
  messageQueue: [],
  postMessage: (opts) => {
    window.sw.messageQueue.push(opts);
  },
};

if ('serviceWorker' in navigator) {
  const { EVENT__SERVICE_WORKER__REGISTER } = require('../constants');
  
  // Bandwidth and CPU time must be shared while the cache is being filled
  // during the ServiceWorker's installation phase, so wait for the App has
  // loaded.
  window.addEventListener(EVENT__SERVICE_WORKER__REGISTER, () => {
    const LOG_PREFIX = '[SW]';
    const IGNORED = ['browser-sync', '/api/'];
    const ignoredRegEx = new RegExp(`(?:${IGNORED.join('|')})`);
    
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        if (reg.installing) { // only available during install
          const cacheURLs = [
            location.href,
            ...performance.getEntriesByType('resource').map(({ name }) => name),
          ].filter(url => !ignoredRegEx.test(url));
          
          console.log(`${LOG_PREFIX} Install`);
          
          reg.installing.postMessage({
            step: 'install',
            type: 'CACHE_URLS',
            urls: cacheURLs,
          });
        }
        
        console.log(`${LOG_PREFIX} Registered`);
      })
      .catch(err => console.log(`${LOG_PREFIX} Registration failed:\n${err.stack}`));
    
    navigator.serviceWorker.addEventListener('message', ({ data }) => {
      console.log(`${LOG_PREFIX} ${data}`);
    });
    
    navigator.serviceWorker.ready.then(reg => {
      window.sw.postMessage = reg.active.postMessage.bind(reg.active);
      if (window.sw.messageQueue.length) {
        window.sw.messageQueue.forEach(msg => window.sw.postMessage(msg));
      }
    });
  });
}
