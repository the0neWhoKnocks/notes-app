const log = require('../../utils/logger')('api.user.data.get');
const loadUserData = require('../utils/loadUserData');

module.exports = async function getData(req, res) {
  const {
    appConfig,
    body: { password, type, username },
  } = req;
  
  if (!username && !password) return res.error(400, 'Missing `username` and `password`');
  else if (!username) return res.error(400, 'Missing `username`');
  else if (!password) return res.error(400, 'Missing `password`');
  
  try {
    const data = await loadUserData(appConfig, username, password, type);
    
    log.info('Got data');
    res.json(data);
  }
  catch (err) {
    const msg = `Error getting data\n${err.stack}`;
    log.error(msg);
    res.error(500, msg);
  }
}
