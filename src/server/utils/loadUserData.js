const { existsSync, promises: { copyFile, readFile, unlink } } = require('fs');
const { DATA_TYPE__ALL } = require('../../constants');
const log = require('../../utils/logger')('loadUserData');
const {
  formatDataTypes,
  loadDefaultData,
  loadExistingData,
} = require('../../utils/modifyUserData.mjs');
const decrypt = require('./decrypt');
const encrypt = require('./encrypt');
const getUserDataPath = require('./getUserDataPath');
const saveUserData = require('./saveUserData');

module.exports = async function loadUserData(appConfig, username, password, type = DATA_TYPE__ALL) {
  const { valueHex: encryptedUsername } = await encrypt(appConfig, username);
  let {
    notesFName,
    oldFormat,
    prefsFName,
    userDataPath,
  } = getUserDataPath(encryptedUsername);
  
  // migrate old file naming schema
  if (existsSync(oldFormat)) {
    log.info('migrating old data structure');
    
    let oldData = JSON.parse(await readFile(oldFormat, 'utf8'));
    oldData = JSON.parse(await decrypt(appConfig, oldData, password));
    const types = await formatDataTypes(oldData, DATA_TYPE__ALL, { config: appConfig, encrypt, password });
    
    await copyFile(oldFormat, `${oldFormat}.bak`);
    await saveUserData({ appConfig, types, username });
    await unlink(oldFormat);
  }
  
  const loadParse = async (fName) => {
    let data = JSON.parse(await readFile(`${userDataPath}/${fName}`, 'utf8'));
    data = JSON.parse(await decrypt(appConfig, data, password));
    return data;
  };
  
  const setTypeDefault = async (types, err) => {
    let data;
    if (err.message.includes('ENOENT')) {
      data = await saveUserData({ appConfig, types, username });
    }
    return data;
  };
  
  if (existsSync(userDataPath)) {
    return await loadExistingData({
      config: appConfig,
      encrypt,
      notes: {
        load: async () => await loadParse(notesFName),
        setDefault: setTypeDefault,
      },
      password,
      prefs: {
        load: async () => await loadParse(prefsFName),
        setDefault: setTypeDefault,
      },
      type,
    });
  }
  
  return await loadDefaultData({
    config: appConfig,
    encrypt,
    password,
    setDefault: async (types) => { await saveUserData({ appConfig, types, username }); },
    type,
  });
};
