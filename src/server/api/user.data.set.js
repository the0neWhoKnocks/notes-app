const log = require('../../utils/logger')('api.user.data.set');
const {
  EP__SET__USER_DATA,
  default: genAPIPayload,
} = require('../../utils/genAPIPayload');
const modifyUserData = require('../../utils/modifyUserData').default;
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
    
    res.json(genAPIPayload({
      action,
      data,
      endpoint: EP__SET__USER_DATA,
      nodeId,
      nodePath: reqBody.path,
      type,
    }));
  }
  catch (err) {
    res.error(500, err);
  }
}
