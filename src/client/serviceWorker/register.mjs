import {
  CHANNEL__INIT_API_DATA,
  CHANNEL__INSTALL_CHECK,
  CHANNEL__MESSAGES,
  CHANNEL__OFFLINE_DATA,
  MSG_TYPE__CACHE_URLS,
  MSG_TYPE__SKIP_WAITING,
} from './constants.mjs';
import l from './logger.mjs'; 
import swAllowed from './swAllowed.mjs';

const log = l('reg');

class NotAllowedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotAllowedError';
  }
}


const icChannel = new BroadcastChannel(CHANNEL__INSTALL_CHECK);
const handler = () => {
  const { appId } = window.sw.envVars;
  
  icChannel.postMessage({ appId });
  icChannel.removeEventListener('message', handler);
  icChannel.close();
};
icChannel.addEventListener('message', handler);


window.sw = window.sw || {};
window.sw = {
  ...window.sw,
  
  NotAllowedError,
  
  activated() {
    // `controller` will be `null` if the current page is not controlled by a service worker.
    return navigator.serviceWorker.controller;
  },
  
  initAPIData(creds) {
    if (window.sw.initAPIData.promise) return window.sw.initAPIData.promise;
    
    const p = new Promise((resolve, reject) => {
      const channel = new BroadcastChannel(CHANNEL__INIT_API_DATA);
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
  
  listenForWaiting(reg, cb) {
    function awaitStateChange() {
      reg.installing.addEventListener('statechange', ({ target: { state } }) => {
        switch (state) {
          case 'installed': cb(); break;
          default: {
            log.debug(`Unhandled state change: ${state}`);
          }
        }
      });
    }
    
    if (reg.waiting) return cb();
    if (reg.installing) awaitStateChange();
    
    reg.addEventListener('updatefound', awaitStateChange);
  },
  
  onActivatedHandlers: [],
  onActivated(handler) {
    window.sw.onActivatedHandlers.push(handler);
  },
  
  onErrorHandlers: [],
  onError(handler) {
    window.sw.onErrorHandlers.push(handler);
  },
  
  onInstallHandlers: [],
  onInstall(handler) {
    window.sw.onInstallHandlers.push(handler);
  },
  
  onUpdateAvailableHandlers: [],
  onUpdateAvailable(handler) {
    window.sw.onUpdateAvailableHandlers.push(handler);
  },
  
  messageQueue: [],
  // NOTE: This function gets overwritten in `navigator.serviceWorker.ready`.
  // This just catches messages that were dispatched before the SW was initialized.
  postMessage(opts) {
    window.sw.messageQueue.push(opts);
  },
  
  postOfflineDataMessage(payload) {
    return new Promise((resolve) => {
      const channel = new BroadcastChannel(CHANNEL__OFFLINE_DATA);
      const handler = ({ data }) => {
        channel.removeEventListener('message', handler);
        channel.close();
        resolve(data);
      };
      
      channel.addEventListener('message', handler);
      channel.postMessage(payload);
    });
  },
  
  async register() {
    if ('serviceWorker' in navigator) {
      window.sw.channel = new BroadcastChannel(CHANNEL__MESSAGES);
      
      // Allow User to opt-in to running the SW.
      const { allowedDomains } = window.sw.envVars;
      const { allowed, reason } = swAllowed({
        allowedDomains,
        url: window.location.href,
      });
      if (!allowed) {
        const msg = `'serviceWorker' not allowed: ${reason}`;
        log.warn(msg);
        throw new NotAllowedError(msg);
      }
      
      window.sw.channel.addEventListener('message', ({ data }) => {
        log.info(`Status: ${data.status}`);
        
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
              type: MSG_TYPE__CACHE_URLS,
              urls: window.sw.assetsToCache,
            });
            window.sw.onInstallHandlers.forEach(handler => { handler(); });
            break;
          }  
        }
      });
      
      // NOTE: This the end of the User accepted update process when they've
      // chosen to Reload. This gets triggered by `skipWaiting` in `worker`.
      let refreshing;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
      
      navigator.serviceWorker.ready.then(() => {
        window.sw.postMessage = window.sw.channel.postMessage.bind(window.sw.channel);
        if (window.sw.messageQueue.length) {
          window.sw.messageQueue.forEach(msg => window.sw.postMessage(msg));
        }
      });
      
      try {
        const reg = await navigator.serviceWorker.register('/js/sw/worker.mjs', { scope: '/', type: 'module' });
        
        window.sw.listenForWaiting(reg, () => {
          window.sw.onUpdateAvailableHandlers.forEach(handler => { handler(); });
        });
        
        log.info('Registered');
      }
      catch (err) {
        const msg = `Registration failed:\n${err}`
        log.error(msg);
        throw Error(err);
      }
    }
    else {
      const msg = `Browser doesn't support 'serviceWorker'.`;
      log.info(msg);
      throw new NotAllowedError(msg);
    }
  },
  
  updateWorker() {
    window.sw.postMessage({ type: MSG_TYPE__SKIP_WAITING });
  },
};
