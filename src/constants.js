const API_PREFIX = '/api';
const NAMESPACE__STORAGE = 'notes';

// Shared by both Client and Server
exports.API_PREFIX = API_PREFIX;
exports.APP__TITLE = 'Notes';
exports.BASE_DATA_NODE = 'root';
exports.DATA_ACTION__ADD = 'add';
exports.DATA_ACTION__APPLY_OFFLINE_CHANGES = 'applyOfflineChanges';
exports.DATA_ACTION__DELETE = 'delete';
exports.DATA_ACTION__EDIT = 'edit';
exports.DATA_ACTION__IMPORT = 'importData';
exports.DATA_ACTION__MOVE = 'move';
exports.DATA_TYPE__ALL = 'all';
exports.DATA_TYPE__GROUP = 'group';
exports.DATA_TYPE__NOTE = 'note';
exports.DATA_TYPE__NOTES = 'notes';
exports.DATA_TYPE__PREFS = 'preferences';
exports.DATA_TYPE__RECENT = 'recentlyViewed';
exports.DOM__SVELTE_MOUNT_POINT = 'view';
exports.LOC__TIME_ZONE = process.env.TZ || 'America/Los_Angeles';
exports.NAMESPACE__LOGGER = 'notes';
exports.NAMESPACE__STORAGE = NAMESPACE__STORAGE;
exports.NAMESPACE__STORAGE__USER = `${NAMESPACE__STORAGE}.user`;
exports.PRISMAJS__COPY_TEXT = '⧉ Copy'; // `&#10697;`
exports.ROUTE__API__CONFIG__CREATE = `${API_PREFIX}/config/create`;
exports.ROUTE__API__USER__DATA__GET = `${API_PREFIX}/user/data`;
exports.ROUTE__API__USER__DATA__SET = `${API_PREFIX}/user/data/set`;
exports.ROUTE__API__USER__LOGIN = `${API_PREFIX}/user/login`;
exports.ROUTE__API__USER__PROFILE__CREATE = `${API_PREFIX}/user/profile/create`;
exports.ROUTE__API__USER__PROFILE__DELETE = `${API_PREFIX}/user/profile/delete`;
exports.ROUTE__API__USER__PROFILE__GET = `${API_PREFIX}/user/profile`;
exports.ROUTE__API__USER__PROFILE__SET = `${API_PREFIX}/user/profile/set`;
exports.SCHEMA_VERSION__EXPORTED_DATA = '2.0.0';
exports.SW__CHANNEL__INIT_API_DATA = 'sw_initAPIData';
exports.SW__CHANNEL__MESSAGES = 'sw_messages';
exports.SW__CHANNEL__OFFLINE_DATA = 'sw_offlineData';

if (!process.env.FOR_CLIENT_BUNDLE) {
  // Server only (will be stripped out via WP)
  const { resolve } = require('path');
  
  const ROOT_PATH = resolve(__dirname, './');
  const DATA_PATH = process.env.DATA_PATH || `${ROOT_PATH}/../data`;
  
  exports.CRYPT__ALGORITHM = 'aes-256-gcm';
  exports.CRYPT__LENGTH__BYTES = 16;
  exports.CRYPT__LENGTH__KEY = 32;
  exports.CRYPT__ENCODING = 'hex';
  exports.DISCONNECT_TIMEOUT = 5000;
  exports.PATH__CONFIG = `${DATA_PATH}/config.json`;
  exports.PATH__DATA = DATA_PATH;
  exports.PATH__PUBLIC = `${ROOT_PATH}/public`;
  exports.PATH__USERS = `${DATA_PATH}/users.json`;
  exports.SERVER__PORT = +process.env.SERVER_PORT || 3000;
}
