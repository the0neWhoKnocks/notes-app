const API_PREFIX = '/api';
const NAMESPACE__STORAGE = 'notes';

// Shared by both Client and Server
const constants = {
  APP__TITLE: 'Notes',
  DOM__SVELTE_MOUNT_POINT: 'view',
  EVENT__SERVICE_WORKER__ACTIVATED: 'activatedSW',
  EVENT__SERVICE_WORKER__ERROR: 'swError',
  EVENT__SERVICE_WORKER__INSTALLING: 'installingSW',
  NAMESPACE__LOGGER: 'notes',
  NAMESPACE__STORAGE,
  NAMESPACE__STORAGE__USER: `${NAMESPACE__STORAGE}.user`,
  ROUTE__API__CONFIG_CREATE: `${API_PREFIX}/config/create`,
  ROUTE__API__USER_GET_DATA: `${API_PREFIX}/user/data`,
  ROUTE__API__USER_GET_PROFILE: `${API_PREFIX}/user/profile`,
  ROUTE__API__USER_CREATE: `${API_PREFIX}/user/create`,
  ROUTE__API__USER_LOGIN: `${API_PREFIX}/user/login`,
  ROUTE__API__USER_SET_DATA: `${API_PREFIX}/user/data/set`,
  ROUTE__API__USER_SET_PROFILE: `${API_PREFIX}/user/profile/set`,
};

if (!process.env.FOR_CLIENT_BUNDLE) {
  // Server only (will be stripped out via WP)
  const { resolve } = require('path');
  
  const ROOT_PATH = resolve(__dirname, './');
  const DATA_PATH = process.env.DATA_PATH || `${ROOT_PATH}/../data`;
  
  constants.CRYPT__ALGORITHM = 'aes-256-gcm';
  constants.CRYPT__LENGTH__BYTES = 16;
  constants.CRYPT__LENGTH__KEY = 32;
  constants.CRYPT__ENCODING = 'hex';
  constants.DISCONNECT_TIMEOUT = 5000;
  constants.GROUP_NODE_SHAPE = {
    groups: {},
    notes: {},
  };
  constants.PATH__CONFIG = `${DATA_PATH}/config.json`;
  constants.PATH__DATA = DATA_PATH;
  constants.PATH__PUBLIC = `${ROOT_PATH}/public`;
  constants.PATH__USERS = `${DATA_PATH}/users.json`;
  constants.SERVER__PORT = +process.env.SERVER_PORT || 3000;
}

module.exports = constants;
