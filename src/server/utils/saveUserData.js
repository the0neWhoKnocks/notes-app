const { existsSync } = require('node:fs');
const { writeFile } = require('node:fs/promises');
const mkdirp = require('mkdirp');
const {
  DATA_TYPE__ALL,
  DATA_TYPE__GROUP,
  DATA_TYPE__NOTE,
  DATA_TYPE__NOTES,
  DATA_TYPE__PREFS,
  DATA_TYPE__RECENT,
} = require('../../constants');
const log = require('../../utils/logger')('saveUserData');
const encrypt = require('../utils/encrypt');
const getUserDataPath = require('../utils/getUserDataPath');
const genSchema = require('./genSchema');

module.exports = async function saveUserData({
  appConfig,
  data = {},
  password,
  type,
  username,
} = {}) {
  const { valueHex: encryptedUsername } = await encrypt(appConfig, username);
  const { notesFName, userDataPath, prefsFName } = getUserDataPath(encryptedUsername);
  const types = [];
  
  if (type === DATA_TYPE__ALL) {
    const { [DATA_TYPE__PREFS]: prefs, ...notes } = data;
    types.push(
      [DATA_TYPE__PREFS, { ...genSchema(DATA_TYPE__PREFS).defaultObj[DATA_TYPE__PREFS], ...prefs }],
      [DATA_TYPE__NOTES, { ...genSchema(DATA_TYPE__NOTES).defaultObj, ...notes }],
    );
  }
  else {
    let schema = genSchema(type).defaultObj;
    let _data = data;
    
    switch (type) {
      case DATA_TYPE__PREFS: {
        schema = schema[DATA_TYPE__PREFS];
        _data = data[DATA_TYPE__PREFS];
        break;
      }
    }
    
    types.push([type, { ...schema, ..._data }]);
  }
  
  const result = [];
  for (let [ _type, _data ] of types) {
    const { combined: encryptedData } = await encrypt(appConfig, _data, password);
    
    let fileName;
    switch (_type) {
      case DATA_TYPE__GROUP:
      case DATA_TYPE__NOTE:
      case DATA_TYPE__NOTES:
      case DATA_TYPE__RECENT: fileName = notesFName; break;
      case DATA_TYPE__PREFS: fileName = prefsFName; break;
      default: {
        throw new Error(`Type '${_type}' is not supported when setting User data.`);
      }
    }
    const filePath = `${userDataPath}/${fileName}`;
    
    try {
      if (!existsSync(userDataPath)) await mkdirp(userDataPath);
      await writeFile(filePath, JSON.stringify(encryptedData, null, 2), 'utf8');
      result.push(_data);
    }
    catch (err) {
      const msg = `Error writing data for '${_type}' to "${filePath}"\n${err.stack}`;
      log.error(msg);
      throw new Error(msg);
    }
  }
  
  return (result.length === 1) ? result[0] : result;
}
