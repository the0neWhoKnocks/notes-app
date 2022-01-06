const { existsSync, promises: { readFile } } = require('fs');
const { BASE_DATA_NODE } = require('../../constants');
const groupNodeShape = require('../../utils/groupNodeShape');
const decrypt = require('./decrypt');
const encrypt = require('./encrypt');
const getUserDataPath = require('./getUserDataPath');

module.exports = async function loadUserData(appConfig, username, password) {
  const { valueHex: encryptedUsername } = await encrypt(appConfig, username);
  const filePath = getUserDataPath(encryptedUsername);
  const defaultObj = {
    allTags: {},
    notesData: {
      [BASE_DATA_NODE]: groupNodeShape(),
    },
    preferences: {},
    recentlyViewed: [],
  };
  
  if (existsSync(filePath)) {
    let data = JSON.parse(await readFile(filePath, 'utf8'));
    data = JSON.parse(await decrypt(appConfig, data, password));
    
    // ensure default Object keys exist in case new items are added in the future.
    Object.entries(defaultObj).forEach(([prop, val]) => {
      if (!data[prop]) data[prop] = val;
    });
    
    return data;
  }
  
  return defaultObj;
}
