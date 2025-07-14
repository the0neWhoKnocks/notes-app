const { 
  DATA_ACTION__ADD,
  DATA_ACTION__EDIT,
  DATA_TYPE__NOTE,
} = require('../../constants');
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
  
  const { data, error, logMsg, nodeId } = await modifyUserData({
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
    
    if (
      type === DATA_TYPE__NOTE
      && (
        action === DATA_ACTION__ADD
        || action === DATA_ACTION__EDIT
      )
    ) {
      const nPath = (action === DATA_ACTION__ADD) ? `${reqBody.path}/${nodeId}` : reqBody.path;
      const { note } = getNoteNode(data.notesData, nPath);
      res.json({ ...data, newData: note, newPath: nPath });
    }
    else {
      res.json({ ...data });
    }
  });
}
