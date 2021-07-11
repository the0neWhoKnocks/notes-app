const log = require('../../utils/logger')('api.user.data.get');
const loadUserData = require('../utils/loadUserData');

module.exports = async function getData(req, res) {
  const {
    appConfig,
    body: { password, username },
  } = req;
  
  try {
    const data = await loadUserData(appConfig, username, password);
    
    log.info('Got data');
    res.json(data);
  }
  catch (err) {
    const msg = `Error getting data\n${err.stack}`;
    log.error(msg);
    res.error(500, msg);
  }
}
