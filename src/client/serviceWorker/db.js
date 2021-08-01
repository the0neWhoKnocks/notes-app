import {
  CRYPT__SALT,
  CRYPT__IV_LENGTH,
  DB_NAME,
  DB_VERSION,
} from '/serviceWorker/constants.js';
import { bufferToBase64 } from '/serviceWorker/crypt.js';

const LOG_PREFIX = '[DB]';
let dbRef;

const dbAPI = {
  get: (storeKey) => {
    if (dbAPI.store) {
      return new Promise((resolve, reject) => {
        const req = dbAPI.store.get(storeKey);
        req.onsuccess = () => { resolve(req.result); };
        req.onerror = () => { reject(`${LOG_PREFIX}[get] ${req.error}`); };
      });
    }
    else {
      throw Error(`${LOG_PREFIX} Store hasn't been selected`);
    }
  },
  selectStore: (storeName) => {
    if (dbRef) {
      const trans = dbRef.transaction(storeName, 'readwrite');
      dbAPI.store = trans.objectStore(storeName);
    }
    else {
      throw Error(`${LOG_PREFIX} No DB reference found`);
    }
    
    return dbAPI;
  },
  set: async (data) => {
    if (dbAPI.store) {
      const store = await dbAPI.store;
      
      return new Promise((resolve, reject) => {
        const req = store.add(data);
        req.onsuccess = () => { resolve(req.result); };
        req.onerror = () => { reject(`${LOG_PREFIX}[set] ${req.error}`); };
      });
    }
    else {
      throw Error(`${LOG_PREFIX} Store hasn't been selected`);
    }
  },
};

export function getDB() {
  return new Promise((resolve, reject) => {
    if (!dbRef) {
      const db = indexedDB.open(DB_NAME, DB_VERSION);
      
      // First time setup, flesh out the DB
      db.onupgradeneeded = () => {
        const cryptStore = db.result.createObjectStore('crypt', { keyPath: 'version' });
        cryptStore.createIndex('version', 'version', { unique: true });
      
        const usersStore = db.result.createObjectStore('users', { keyPath: 'username' });
        usersStore.createIndex('username', 'username', { unique: true });
      
        const userDataStore = db.result.createObjectStore('userData');
        userDataStore.createIndex('notes', 'notes', { unique: false });
        userDataStore.createIndex('preferences', 'preferences', { unique: false });
        
        console.log(`${LOG_PREFIX} Added base data`);
      };
      db.onsuccess = async () => {
        console.log(`${LOG_PREFIX} Opened "${DB_NAME}"`);
        dbRef = db.result;
      
        try {
          const cryptDataExists = await dbAPI.selectStore('crypt').get(DB_VERSION);
          if (!cryptDataExists) {
            const salt = (new TextEncoder()).encode(CRYPT__SALT);
            const iv = crypto.getRandomValues(new Uint8Array(CRYPT__IV_LENGTH));
            
            await dbAPI.selectStore('crypt').set({
              iv: bufferToBase64(iv),
              salt: bufferToBase64(salt),
              version: DB_VERSION,
            });
          }
          
          resolve(dbAPI);
        }
        catch (err) { reject(`${LOG_PREFIX} Error adding crypt data:\n${err}`); }
      };
      db.onerror = () => {
        reject(`${LOG_PREFIX} Error opening "${DB_NAME}@v${DB_VERSION}":\n${db.error}`);
      };
    }
    else {
      resolve(dbAPI);
    }
  });
}
