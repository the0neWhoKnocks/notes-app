const { writeFile } = require('fs');
const log = require('../../utils/logger')('api.user.data.set');
const encrypt = require('../utils/encrypt');
const getUserDataPath = require('../utils/getUserDataPath');

module.exports = async function setData(req, res) {
  const {
    appConfig,
    body: { data, password, username },
  } = req;
  
  if (!data) return res.error(400, 'Missing `data`');
  else if (!username && !password) return res.error(400, 'Missing `username` and `password`');
  else if (!username) return res.error(400, 'Missing `username`');
  else if (!password) return res.error(400, 'Missing `password`');
  
  const { valueHex: encryptedUsername } = await encrypt(appConfig, username);
  const filePath = getUserDataPath(encryptedUsername);
  const { combined: encryptedData } = (await encrypt(appConfig, data, password));
  
  writeFile(filePath, JSON.stringify(encryptedData, null, 2), 'utf8', (err) => {
    if (err) {
      const msg = `Error writing data to "${filePath}"\n${err.stack}`;
      log.error(msg);
      return res.error(500, msg);
    }
    
    log.info('Data set');
    res.json({ message: 'Data set' });
  });
}
