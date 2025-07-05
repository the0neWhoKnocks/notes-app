const { writeFile } = require('fs');
const log = require('../../utils/logger')('api.user.data.set');
const { getNoteNode } = require('../../utils/dataNodeUtils');
const modifyUserData = require('../../utils/modifyUserData');
const encrypt = require('../utils/encrypt');
const getUserDataPath = require('../utils/getUserDataPath');
const loadUserData = require('../utils/loadUserData');

module.exports = async function setData(req, res) {
  const { appConfig, body: reqBody } = req;
  const { action, password, type, username } = reqBody;
  
  const { data, error, logMsg } = await modifyUserData({
    loadCurrentData: async () => {
      return await loadUserData(appConfig, username, password);
    },
    logMsg: 'Data set',
    reqBody,
  });
  
  if (error) {
    const { code, msg } = error;
    return res.error(code, msg);
  }
  
  const { valueHex: encryptedUsername } = await encrypt(appConfig, username);
  const filePath = getUserDataPath(encryptedUsername);
  const { combined: encryptedData } = (await encrypt(appConfig, data, password));
  
  writeFile(filePath, JSON.stringify(encryptedData, null, 2), 'utf8', (err) => {
    if (err) {
      const msg = `Error writing data to "${filePath}"\n${err.stack}`;
      log.error(msg);
      return res.error(500, msg);
    }
  
    log.info(logMsg);
    
    if (action === 'edit' && type === 'note') {
      const { note } = getNoteNode(data.notesData, reqBody.path);
      res.json({ ...data, newData: note });
    }
    else {
      res.json({ ...data });
    }
  });
}
