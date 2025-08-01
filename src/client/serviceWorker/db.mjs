import {
  CRYPT__SALT,
  CRYPT__IV_LENGTH,
  DB_NAME,
  DB_VERSION,
} from './constants.mjs';
import { bufferToBase64 } from './crypt.mjs';
import l from './logger.mjs';

const log = l('db');
let dbRef;

const dbAPI = {
  dbExists: async () => {
    const dbs = await indexedDB.databases();
    return !!dbs.find(({ name }) => name === DB_NAME);
  },
  get: async (storeKey, failSilently = false) => {
    if (dbAPI.store) {
      const store = await dbAPI.store();
      
      return new Promise((resolve, reject) => {
        const req = store.get(storeKey);
        
        req.onsuccess = () => {
          if (!req.result) {
            (failSilently)
              ? resolve(undefined)
              : reject(`[get] No 'keyPath' matching "${storeKey}" found in "${store.name}"`);
          }
          else resolve(req.result);
        };
        req.onerror = () => {
          (failSilently)
            ? resolve(undefined)
            : reject(`[get] ${req.error}`);
        };
      });
    }
    else if (!failSilently) throw Error(`Store hasn't been selected`);
  },
  selectStore: (storeName) => {
    if (dbRef) {
      dbAPI.store = async () => {
        // In case a DB is deleted in the middle of App usage (edge-case),
        // reinitialize so no errors are thrown.
        const dbExists = await dbAPI.dbExists();
        if (!dbExists) await initDB();
        
        const trans = dbRef.transaction(storeName, 'readwrite');
        return trans.objectStore(storeName);
      };
    }
    else {
      throw Error('No DB reference found');
    }
    
    return dbAPI;
  },
  set: async (data) => {
    if (dbAPI.store) {
      const store = await dbAPI.store();
      
      return new Promise((resolve, reject) => {
        // NOTE: `put` will overwrite/add data, unlike `add` which will fail if
        // a value already exists with the same `keyPath`.
        const req = store.put(data);
        req.onsuccess = () => { resolve(req.result); };
        req.onerror = () => { reject(`[set] ${req.error}`); };
      });
    }
    else {
      throw Error(`Store hasn't been selected`);
    }
  },
};

export function initDB() {
  return new Promise((resolve, reject) => {
    const db = indexedDB.open(DB_NAME, DB_VERSION);
    
    // First time setup, flesh out the DB
    db.onupgradeneeded = () => {
      const cryptStore = db.result.createObjectStore('crypt', { keyPath: 'version' });
      cryptStore.createIndex('version', 'version', { unique: true });
    
      const usersStore = db.result.createObjectStore('users', { keyPath: 'username' });
      usersStore.createIndex('username', 'username', { unique: true });
    
      const userDataStore = db.result.createObjectStore('userData', { keyPath: 'username' });
      userDataStore.createIndex('username', 'username', { unique: true });
      
      log.info('Added base data');
    };
    db.onsuccess = async () => {
      log.info(`Opened "${DB_NAME}"`);
      dbRef = db.result;
      
      try {
        const cryptDataExists = await dbAPI.selectStore('crypt').get(DB_VERSION, true);
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
      catch (err) { reject(`Error adding crypt data:\n${err}`); }
    };
    db.onerror = () => {
      reject(`Error opening "${DB_NAME}@v${DB_VERSION}":\n${db.error}`);
    };
  });
}
