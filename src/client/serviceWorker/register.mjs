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
  
  onInstalledHandlers: [],
  onInstalled(handler) {
    window.sw.onInstalledHandlers.push(handler);
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
      
      navigator.serviceWorker.ready.then(() => {
        window.sw.postMessage = window.sw.channel.postMessage.bind(window.sw.channel);
        if (window.sw.messageQueue.length) {
          window.sw.messageQueue.forEach(msg => window.sw.postMessage(msg));
        }
      });
      
      try {
        const reg = await navigator.serviceWorker.register('/js/sw/worker.mjs', { scope: '/', type: 'module' });
        
        const callUpdateHandlers = () => {
          window.sw.onUpdateAvailableHandlers.forEach(handler => { handler(); });
        };
        
        // New worker waiting to be activated. Gets hit only after a worker was
        // loaded into a waiting state and the page was reloaded.
        if (reg.waiting && reg.active) { callUpdateHandlers(); }
        
        // For the first install and any following updates.
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          
          if (worker === null) return;
          
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed') {
              window.sw.onInstalledHandlers.forEach(handler => { handler(); });
              
              // Gets hit when there's an existing worker and another worker gets
              // loaded and put into a waiting state.
              if (navigator.serviceWorker.controller) { callUpdateHandlers(); }
            }
          });
        });
        
        log.info('Registered');
      }
      catch (err) {
        const msg = `Registration failed:\n${err}`;
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
