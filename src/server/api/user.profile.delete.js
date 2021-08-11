const { existsSync, unlinkSync, writeFile } = require('fs');
const { PATH__USERS } = require('../../constants');
const log = require('../../utils/logger')('api.user.profile.set');
const encrypt = require('../utils/encrypt');
const getUserDataPath = require('../utils/getUserDataPath');
const loadUsers = require('../utils/loadUsers');

module.exports = async function deleteProfile(req, res) {
  try {
    const {
      appConfig,
      body: { username },
    } = req;
    
    if (!username) {
      const msg = `Looks like you're missing 'username'`;
      log.error(msg);
      return res.error(400, msg);
    }
    
    const { valueHex: encryptedUsername } = (await encrypt(appConfig, username));
    const users = await loadUsers();
    const DATA_PATH = getUserDataPath(encryptedUsername);
    
    if (existsSync(DATA_PATH)) {
      unlinkSync(DATA_PATH);
      log.info(`Removed User data at "${DATA_PATH}"`);
    }
    
    delete users[encryptedUsername];
    writeFile(PATH__USERS, JSON.stringify(users, null, 2), 'utf8', (err) => {
      if (err) {
        const msg = `Failed to update "${PATH__USERS}"\n${err.stack}`;
        log.error(msg);
        return res.error(500, msg);
      }
      
      log.info(`Removed profile data for "${username}"`);
    });
    
    log.info(`All profile data for "${username}" removed`);
    res.json({ deleted: true });
  }
  catch (err) {
    const msg = `Failed to delete profile data \n ${err.stack}`;
    log.error(msg);
    res.error(500, msg);
  }
}
