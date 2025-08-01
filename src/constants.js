const API_PREFIX = '/api';
const NAMESPACE__STORAGE = 'notes';

// Shared by both Client and Server
const constants = {
  API_PREFIX,
  APP__TITLE: 'Notes',
  BASE_DATA_NODE: 'root',
  DATA_ACTION__ADD: 'add',
  DATA_ACTION__APPLY_OFFLINE_CHANGES: 'applyOfflineChanges',
  DATA_ACTION__DELETE: 'delete',
  DATA_ACTION__EDIT: 'edit',
  DATA_ACTION__IMPORT: 'importData',
  DATA_ACTION__MOVE: 'move',
  DATA_TYPE__ALL: 'all',
  DATA_TYPE__GROUP: 'group',
  DATA_TYPE__NOTE: 'note',
  DATA_TYPE__NOTES: 'notes',
  DATA_TYPE__PREFS: 'preferences',
  DATA_TYPE__RECENT: 'recentlyViewed',
  DOM__SVELTE_MOUNT_POINT: 'view',
  LOC__TIME_ZONE: process.env.TIME_ZONE || 'America/Los_Angeles',
  NAMESPACE__LOGGER: 'notes',
  NAMESPACE__STORAGE,
  NAMESPACE__STORAGE__USER: `${NAMESPACE__STORAGE}.user`,
  PRISMAJS__COPY_TEXT: '⧉ Copy', // `&#10697;`
  ROUTE__API__CONFIG__CREATE: `${API_PREFIX}/config/create`,
  ROUTE__API__USER__DATA__GET: `${API_PREFIX}/user/data`,
  ROUTE__API__USER__DATA__SET: `${API_PREFIX}/user/data/set`,
  ROUTE__API__USER__LOGIN: `${API_PREFIX}/user/login`,
  ROUTE__API__USER__PROFILE__CREATE: `${API_PREFIX}/user/profile/create`,
  ROUTE__API__USER__PROFILE__DELETE: `${API_PREFIX}/user/profile/delete`,
  ROUTE__API__USER__PROFILE__GET: `${API_PREFIX}/user/profile`,
  ROUTE__API__USER__PROFILE__SET: `${API_PREFIX}/user/profile/set`,
  SCHEMA_VERSION__EXPORTED_DATA: '2.0.0',
  SW__CHANNEL__INIT_API_DATA: 'sw_initAPIData',
  SW__CHANNEL__MESSAGES: 'sw_messages',
  SW__CHANNEL__OFFLINE_DATA: 'sw_offlineData',
};

if (!process.env.FOR_CLIENT_BUNDLE) {
  // Server only (will be stripped out via WP)
  const { resolve } = require('path');
  
  const ROOT_PATH = resolve(__dirname, './');
  const DATA_PATH = process.env.DATA_PATH || `${ROOT_PATH}/../data`;
  
  Object.assign(constants, {
    CRYPT__ALGORITHM: 'aes-256-gcm',
    CRYPT__LENGTH__BYTES: 16,
    CRYPT__LENGTH__KEY: 32,
    CRYPT__ENCODING: 'hex',
    DISCONNECT_TIMEOUT: 5000,
    PATH__CONFIG: `${DATA_PATH}/config.json`,
    PATH__DATA: DATA_PATH,
    PATH__PUBLIC: `${ROOT_PATH}/public`,
    PATH__USERS: `${DATA_PATH}/users.json`,
    SERVER__PORT: +process.env.SERVER_PORT || 3000,
  });
}

module.exports = constants;
