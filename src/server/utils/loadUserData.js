const { existsSync, promises: { copyFile, readFile, unlink } } = require('fs');
const {
  DATA_TYPE__ALL,
  DATA_TYPE__NOTES,
  DATA_TYPE__PREFS,
} = require('../../constants');
const log = require('../../utils/logger')('loadUserData');
const decrypt = require('./decrypt');
const encrypt = require('./encrypt');
const genSchema = require('./genSchema');
const getUserDataPath = require('./getUserDataPath');
const saveUserData = require('./saveUserData');

module.exports = async function loadUserData(appConfig, username, password, type = DATA_TYPE__ALL) {
  const { defaultObj, notesTypes, prefsTypes } = genSchema(type);
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
    
    await copyFile(oldFormat, `${oldFormat}.bak`);
    await saveUserData({ appConfig, data: oldData, password, type: DATA_TYPE__ALL, username });
    await unlink(oldFormat);
  }
  
  if (existsSync(userDataPath)) {
    const data = {};
    
    // Load/parse existing data OR create default files.
    if (notesTypes.includes(type)) {
      let notesData;
      try {
        notesData = JSON.parse(await readFile(`${userDataPath}/${notesFName}`, 'utf8'));
        notesData = JSON.parse(await decrypt(appConfig, notesData, password));
      }
      catch (err) {
        if (err.message.includes('ENOENT')) {
          notesData = await saveUserData({ appConfig, data: notesData, password, type: DATA_TYPE__NOTES, username });
        }
      }
          
      Object.assign(data, notesData);
    }
    
    if (prefsTypes.includes(type)) {
      let prefsData;
      try {
        prefsData = JSON.parse(await readFile(`${userDataPath}/${prefsFName}`, 'utf8'));
        prefsData = JSON.parse(await decrypt(appConfig, prefsData, password));
      }
      catch (err) {
        if (err.message.includes('ENOENT')) {
          prefsData = await saveUserData({ appConfig, data: prefsData, password, type: DATA_TYPE__PREFS, username });
        }
      }
      
      Object.assign(data, { [DATA_TYPE__PREFS]: { ...prefsData } });
    }
    
    return { ...defaultObj, ...data };
  }
  else {
    await saveUserData({ appConfig, password, type: DATA_TYPE__ALL, username });
  }
  
  return defaultObj;
};
