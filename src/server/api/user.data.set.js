const { writeFile } = require('fs');
const { GROUP_NODE_SHAPE } = require('../../constants');
const getPathNode = require('../../utils/getPathNode');
const kebabCase = require('../../utils/kebabCase');
const log = require('../../utils/logger')('api.user.data.set');
const encrypt = require('../utils/encrypt');
const getUserDataPath = require('../utils/getUserDataPath');
const loadUserData = require('../utils/loadUserData');

module.exports = async function setData(req, res) {
  const {
    appConfig,
    body: { action, content, name, password, path, title, type, username },
  } = req;
  
  if (!action) return res.error(400, 'Missing `action`');
  if (action && !type) return res.error(400, 'Missing `type`');
  else if (
    action === 'add'
    && type === 'note'
    && (!path || !title)
  ) {
    const missingItems = ['path', 'title'].filter(prop => !req.body[prop]).map(prop => `\`${prop}\``).join(' and ');
    return res.error(400, `Missing ${missingItems}`);
  }
  else if (
    action === 'add'
    && type === 'group'
    && (!path || !name)
  ) {
    const missingItems = ['path', 'name'].filter(prop => !req.body[prop]).map(prop => `\`${prop}\``).join(' and ');
    return res.error(400, `Missing ${missingItems}`);
  }
  else if (!username && !password) return res.error(400, 'Missing `username` and `password`');
  else if (!username) return res.error(400, 'Missing `username`');
  else if (!password) return res.error(400, 'Missing `password`');
  
  const data = await loadUserData(appConfig, username, password);
  
  if (action === 'add') {  
    if (type === 'note') {
      const { notes } = getPathNode(data, path);
      const nodeId = kebabCase(title);
      
      if (!notes[nodeId]) {
        notes[nodeId] = { content: content || '', title };
      }
      else return res.error(400, `Note with title "${title}" already exists in "${path}"`);
    }
    else if (type === 'group') {
      const { groups } = getPathNode(data, path);
      const nodeId = kebabCase(name);
      
      if (!groups[nodeId]) {
        groups[nodeId] = { ...GROUP_NODE_SHAPE, groupName: name };
      }
      else return res.error(400, `The group "${name}" already exists in "${path}"`);
    }
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
  
    log.info('Data set');
    res.json(data);
  });
}
