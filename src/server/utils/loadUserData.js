const { existsSync, promises: { readFile } } = require('fs');
const { GROUP_NODE_SHAPE } = require('../../constants');
const decrypt = require('./decrypt');
const encrypt = require('./encrypt');
const getUserDataPath = require('./getUserDataPath');

module.exports = async function loadUserData(appConfig, username, password) {
  const { valueHex: encryptedUsername } = await encrypt(appConfig, username);
  const filePath = getUserDataPath(encryptedUsername);
  
  if (existsSync(filePath)) {
    const data = JSON.parse(await readFile(filePath, 'utf8'));
    return JSON.parse(await decrypt(appConfig, data, password));
  }
  
  return { root: GROUP_NODE_SHAPE };
}
