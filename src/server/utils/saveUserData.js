const { existsSync } = require('node:fs');
const { writeFile } = require('node:fs/promises');
const mkdirp = require('mkdirp');
const {
  DATA_KEY__NOTES,
  DATA_KEY__PREFS,
} = require('../../constants');
const log = require('../../utils/logger')('saveUserData');
const encrypt = require('../utils/encrypt');
const getUserDataPath = require('../utils/getUserDataPath');

module.exports = async function saveUserData({
  appConfig,
  types,
  username,
} = {}) {
  const { valueHex: encryptedUsername } = await encrypt(appConfig, username);
  const { notesFName, prefsFName, userDataPath } = getUserDataPath(encryptedUsername);
  const result = [];
  
  for (let [ type, encryptedData, rawData ] of types) {
    let fileName;
    switch (type) {
      case DATA_KEY__NOTES: fileName = notesFName; break;
      case DATA_KEY__PREFS: fileName = prefsFName; break;
    }
    const filePath = `${userDataPath}/${fileName}`;
    
    try {
      if (!existsSync(userDataPath)) await mkdirp(userDataPath);
      await writeFile(filePath, JSON.stringify(encryptedData, null, 2), 'utf8');
      result.push(rawData);
    }
    catch (err) {
      const msg = `Error writing data for '${type}' to "${filePath}"\n${err.stack}`;
      log.error(msg);
      throw new Error(msg);
    }
  }
  
  return (result.length === 1) ? result[0] : result;
};
