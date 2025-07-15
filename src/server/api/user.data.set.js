const { 
  DATA_ACTION__ADD,
  DATA_ACTION__EDIT,
  DATA_TYPE__NOTE,
} = require('../../constants');
const log = require('../../utils/logger')('api.user.data.set');
const { getNoteNode } = require('../../utils/dataNodeUtils');
const modifyUserData = require('../../utils/modifyUserData');
const loadUserData = require('../utils/loadUserData');
const saveUserData = require('../utils/saveUserData');

module.exports = async function setData(req, res) {
  const { appConfig, body: reqBody } = req;
  const { action, password, type, username } = reqBody;
  
  const { data, error, logMsg, nodeId } = await modifyUserData({
    loadCurrentData: async () => {
      return await loadUserData(appConfig, username, password, type);
    },
    reqBody,
  });
  
  if (error) {
    const { code, msg } = error;
    return res.error(code, msg);
  }
  
  try {
    await saveUserData({ appConfig, data, password, type, username });
    
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
  }
  catch (err) {
    res.error(500, err);
  }
}
