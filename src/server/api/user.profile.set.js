const { existsSync } = require('node:fs');
const { rm, writeFile } = require('node:fs/promises');
const {
  DATA_TYPE__ALL,
  PATH__USERS,
} = require('../../constants');
const log = require('../../utils/logger')('api.user.profile.set');
const decrypt = require('../utils/decrypt');
const encrypt = require('../utils/encrypt');
const getUserDataPath = require('../utils/getUserDataPath');
const loadUsers = require('../utils/loadUsers');
const loadUserData = require('../utils/loadUserData');
const saveUserData = require('../utils/saveUserData');

module.exports = async function setProfile(req, res) {
  try {
    const {
      appConfig,
      body: { oldPassword, oldUsername, password, username },
    } = req;
    const { valueHex: encryptedOldUsername } = (await encrypt(appConfig, oldUsername));
    const { valueHex: encryptedNewUsername } = (await encrypt(appConfig, username));
    const { userDataPath: oldDataPath } = getUserDataPath(encryptedOldUsername);
    const users = await loadUsers();
    const PASSWORD = (password !== oldPassword) ? password : oldPassword;
    const USERNAME = (username !== oldUsername) ? username : oldUsername;
    const CURRENT_DATA_PATH = (username !== oldUsername)
      ? getUserDataPath(encryptedNewUsername).userDataPath
      : oldDataPath;
    
    if (
      (username !== oldUsername)
      && users[encryptedNewUsername]
    ) {
      const msg = `User "${username}" already exists`;
      log.error(msg);
      return res.error(405, msg);
    }
    
    let encryptedUserData = users[encryptedOldUsername];
    const decryptedUserData = JSON.parse(await decrypt(appConfig, encryptedUserData, oldPassword));
    
    // update Users's data
    if (username !== oldUsername) decryptedUserData.username = username;
    if (password !== oldPassword) decryptedUserData.password = password;
    encryptedUserData = (await encrypt(appConfig, decryptedUserData, PASSWORD)).combined;
    users[encryptedOldUsername] = encryptedUserData;
    
    // change the User's key in users.json
    if (username !== oldUsername) {
      users[encryptedNewUsername] = encryptedUserData;
      delete users[encryptedOldUsername];
    }
    
    try {
      await writeFile(PATH__USERS, JSON.stringify(users, null, 2), 'utf8');
      log.info(`Updated "${PATH__USERS}"`);
    }
    catch (err) {
      const msg = `Failed to update "${PATH__USERS}"\n${err.stack}`;
      log.error(msg);
      return res.error(500, msg);
    }
    
    if (password !== oldPassword) {
      const userData = await loadUserData(appConfig, oldUsername, oldPassword);
      await saveUserData({ appConfig, data: userData, password, type: DATA_TYPE__ALL, username });
    }
    
    if (
      CURRENT_DATA_PATH !== oldDataPath
      && existsSync(oldDataPath)
    ) {
      try {
        await rm(oldDataPath, { recursive: true, force: true });
        log.info(`Deleted old User folder "${oldDataPath}"`);
      }
      catch (err) {
        const msg = `Failed to delete old User folder "${oldDataPath}"\n${err.stack}`;
        log.error(msg);
        return res.error(500, msg);
      }
    }
    
    res.json({ username: USERNAME, password: PASSWORD });
  }
  catch (err) {
    const msg = `Failed to set profile data \n ${err.stack}`;
    log.error(msg);
    res.error(500, msg);
  }
}
