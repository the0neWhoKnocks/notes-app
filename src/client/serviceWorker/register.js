const {
  SW__CHANNEL__MESSAGES,
} = require('../../constants');

window.sw = window.sw || {};
window.sw = {
  ...window.sw,
  initAPIData(creds) {
    window.sw.channel.postMessage({ creds, type: 'INIT_API_DATA' });
  },
  messageQueue: [],
  onActivated(handler) {
    window.sw.onActivatedHandlers.push(handler);
  },
  onActivatedHandlers: [],
  onError(handler) {
    window.sw.onErrorHandlers.push(handler);
  },
  onErrorHandlers: [],
  onInstall(handler) {
    window.sw.onInstallHandlers.push(handler);
  },
  onInstallHandlers: [],
  onRegistered(handler) {
    window.sw.onRegisteredHandlers.push(handler);
  },
  onRegisteredHandlers: [],
  postMessage(opts) {
    window.sw.messageQueue.push(opts);
  },
  register() {
    if ('serviceWorker' in navigator) {
      window.sw.channel = new BroadcastChannel(SW__CHANNEL__MESSAGES);
      
      window.addEventListener('load', () => {
        const LOG_PREFIX = '[SW_REGISTER]';
        
        window.sw.channel.addEventListener('message', ({ data }) => {
          console.log(`${LOG_PREFIX} Status: ${data.status}`);
          
          switch (data.status) {
            case 'activated': {
              window.sw.onActivatedHandlers.forEach(handler => { handler(); });
              break;
            }
            case 'error': {
              window.sw.onErrorHandlers.forEach(handler => { handler(); });
              break;
            }
            case 'installing': {
              window.sw.channel.postMessage({
                step: 'installing',
                type: 'CACHE_URLS',
                urls: window.sw.assetsToCache,
              });
              window.sw.onInstallHandlers.forEach(handler => { handler(); });
              break;
            }  
          }
        });
        
        navigator.serviceWorker.register('/js/sw.js', { scope: '/' })
          .then(() => {
            console.log(`${LOG_PREFIX} Registered`);
            window.sw.onRegisteredHandlers.forEach(handler => { handler(); });
          })
          .catch(err => console.log(`${LOG_PREFIX} Registration failed:\n${err}`));
        
        navigator.serviceWorker.ready.then(() => {
          window.sw.postMessage = window.sw.channel.postMessage.bind(window.sw.channel);
          if (window.sw.messageQueue.length) {
            window.sw.messageQueue.forEach(msg => window.sw.postMessage(msg));
          }
        });
      });
    }
  },
};
