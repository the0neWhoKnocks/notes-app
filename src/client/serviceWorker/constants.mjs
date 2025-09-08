export {
  API_PREFIX,
  DATA_KEY__NOTES,
  DATA_KEY__PREFS,
  DATA_TYPE__ALL,
  ROUTE__API__USER__DATA__GET,
  ROUTE__API__USER__DATA__SET,
  ROUTE__API__USER__LOGIN,
} from '../../constants.js';

export const CACHE_KEY = 'notes-app';
export const CHANNEL__INIT_API_DATA = 'sw_initAPIData';
export const CHANNEL__INSTALL_CHECK = 'sw_installCheck';
export const CHANNEL__MESSAGES = 'sw_messages';
export const CHANNEL__OFFLINE_DATA = 'sw_offlineData';
export const CRYPT__SALT = 'purp1eNurp1e'; // TODO pull in salt from config?
export const CRYPT__IV_LENGTH = 12;
export const DB__STORE_NAME__CRYPT = 'crypt';
export const DB__STORE_NAME__NOTES = 'notes';
export const DB__STORE_NAME__PREFS = 'prefs';
export const DB__STORE_NAME__USERS = 'users';
export const DB_NAME = 'notes-app';
export const DB_VERSION = 2;
export const MSG_TYPE__CACHE_URLS = 'cacheURLs';
export const MSG_TYPE__CLEAR_OFFLINE_DATA = 'clearOfflineData';
export const MSG_TYPE__GET_OFFLINE_DATA = 'getOfflineData';
export const MSG_TYPE__SKIP_WAITING = 'skipWaiting';
