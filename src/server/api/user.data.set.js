const { writeFile } = require('fs');
const { GROUP_NODE_SHAPE } = require('../../constants');
const getPathNode = require('../../utils/getPathNode');
const kebabCase = require('../../utils/kebabCase');
const log = require('../../utils/logger')('api.user.data.set');
const encrypt = require('../utils/encrypt');
const getUserDataPath = require('../utils/getUserDataPath');
const loadUserData = require('../utils/loadUserData');

const sanitizeContent = (txt) => {
  // While editing on the Client, only newline characters are present, but
  // during the submission proccess (either via the Form or Post), carriage
  // return characters are added as well, which messes with diff checking on the
  // Client.
  return txt.replace(/\r\n/g, '\n');
};

module.exports = async function setData(req, res) {
  const {
    appConfig,
    body: {
      action,
      content,
      id,
      name,
      oldName,
      oldTitle,
      password,
      path,
      prefs,
      title,
      type,
      username,
    },
  } = req;
  
  if (!action) return res.error(400, 'Missing `action`');
  else if (!['add', 'edit', 'delete'].includes(action)) return res.error(400, `The \`action\` "${action}" is unknown`);
  else if (!type) return res.error(400, 'Missing `type`');
  else if (!username && !password) return res.error(400, 'Missing `username` and `password`');
  else if (!username) return res.error(400, 'Missing `username`');
  else if (!password) return res.error(400, 'Missing `password`');
  else if (!['group', 'note', 'preferences'].includes(type)) return res.error(400, `The \`type\` "${type}" is unknown`);
  else if (type === 'note') {
    let required = ['path', 'title'];
    if (action === 'edit') required.push('oldTitle');
    else if (action === 'delete') required = ['id', 'path'];
    
    const missingItems = required.filter(prop => !req.body[prop]).map(prop => `\`${prop}\``).join(' and ');
    if (missingItems.length) return res.error(400, `Missing ${missingItems}`);
  }
  else if (type === 'group') {
    let required = ['path', 'name'];
    if (action === 'edit') required.push('oldName');
    else if (action === 'delete') required = ['id', 'path'];
    
    const missingItems = required.filter(prop => !req.body[prop]).map(prop => `\`${prop}\``).join(' and ');
    if (missingItems.length) return res.error(400, `Missing ${missingItems}`);
  }
  else if (type === 'preferences') {
    const required = ['prefs'];
    const missingItems = required.filter(prop => !req.body[prop]).map(prop => `\`${prop}\``).join(' and ');
    if (missingItems.length) return res.error(400, `Missing ${missingItems}`);
  }
  
  const data = await loadUserData(appConfig, username, password);
  const notesData = data.notesData;
  let logMsg = 'Data set';
  
  if (action === 'add') {
    if (type === 'note') {
      const { notes } = getPathNode(notesData, path);
      const nodeId = kebabCase(title);
      
      if (!notes[nodeId]) {
        notes[nodeId] = {
          content: sanitizeContent(content) || '',
          created: Date.now(),
          title,
        };
        
        logMsg = `Created note "${title}" in "${path}"`;
      }
      else return res.error(400, `Note with title "${title}" already exists in "${path}"`);
    }
    else if (type === 'group') {
      const { groups } = getPathNode(notesData, path);
      const nodeId = kebabCase(name);
      
      if (!groups[nodeId]) {
        groups[nodeId] = { ...GROUP_NODE_SHAPE, groupName: name };
        
        logMsg = `Created group "${name}" in "${path}"`;
      }
      else return res.error(400, `The group "${name}" already exists in "${path}"`);
    }
  }
  else if (action === 'edit') {
    if (type === 'note') {
      const { notes } = getPathNode(notesData, path);
      let nodeId = kebabCase(oldTitle);
      const oldNote = { ...notes[nodeId] };
      
      if (oldTitle !== title) {
        const newNodeId = kebabCase(title);
        if (notes[newNodeId]) {
          return res.error(400, `Note with title "${title}" already exists in "${path}"`);
        }
        
        delete notes[nodeId];
        nodeId = newNodeId;
      }
      
      notes[nodeId] = {
        ...oldNote,
        content: sanitizeContent(content) || '',
        modified: Date.now(),
        title,
      };
      
      logMsg = `Updated note "${title}" in "${path}"`;
    }
    else if (type === 'group') {
      const { groups } = getPathNode(notesData, path);
      let nodeId = kebabCase(oldName);
      const groupCopy = { ...groups[nodeId] };
      
      if (oldName !== name) {
        const newNodeId = kebabCase(name);
        if (groups[newNodeId]) {
          return res.error(400, `Group "${name}" already exists in "${path}"`);
        }
        
        delete groups[nodeId];
        nodeId = newNodeId;
      }
      
      groups[nodeId] = {
        ...groupCopy,
        groupName: name,
      };
      
      logMsg = `Renamed group from "${oldName}" to "${name}" in "${path}"`;
    }
    else if (type === 'preferences') {
      data.preferences = {
        ...data.preferences,
        ...prefs,
      };
    }
  }
  else if (action === 'delete') {
    if (type === 'note') {
      const { notes } = getPathNode(notesData, path);
      delete notes[id];
      
      logMsg = `Removed note "${id}" from "${path}"`;
    }
    else if (type === 'group') {
      const { groups } = getPathNode(notesData, path);
      delete groups[id];
      
      logMsg = `Removed group "${id}" from "${path}"`;
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
  
    log.info(logMsg);
    res.json(data);
  });
}
