const {
  SW__CHANNEL__INIT_API_DATA,
  SW__CHANNEL__MESSAGES,
  SW__CHANNEL__OFFLINE_DATA,
} = require('../../constants');

window.sw = window.sw || {};
window.sw = {
  ...window.sw,
  getOfflineData(creds) {
    return new Promise((resolve) => {
      const channel = new BroadcastChannel(SW__CHANNEL__OFFLINE_DATA);
      const handler = ({ data }) => {
        channel.removeEventListener('message', handler);
        channel.close();
        resolve(data);
      };
      
      channel.addEventListener('message', handler);
      channel.postMessage({ creds });
    });
  },
  initAPIData(creds) {
    if (window.sw.initAPIData.promise) return window.sw.initAPIData.promise;
    
    const p = new Promise((resolve, reject) => {
      const channel = new BroadcastChannel(SW__CHANNEL__INIT_API_DATA);
      const handler = ({ data }) => {
        channel.removeEventListener('message', handler);
        channel.close();
        
        if (data.error) {
          window.sw.onErrorHandlers.forEach(handler => { handler(data.error); });
          reject(data.error);
        }
        else resolve();
        
        delete window.sw.initAPIData.promise;
      };
      
      channel.addEventListener('message', handler);
      channel.postMessage({ creds });
    });
    window.sw.initAPIData.promise = p;
    
    return p;
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
