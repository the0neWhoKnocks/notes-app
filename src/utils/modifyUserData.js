const groupNodeShape = require('../utils/groupNodeShape');
const getPathNode = require('./getPathNode');
const kebabCase = require('./kebabCase');

const getMissingRequiredItems = (required, propObj) => {
  return required
    .filter(prop => !propObj[prop])
    .map(prop => `\`${prop}\``)
    .join(' and ');
};

const sanitizeContent = (txt) => {
  // While editing on the Client, only newline characters are present, but
  // during the submission proccess (either via the Form or Post), carriage
  // return characters are added as well, which messes with diff checking on the
  // Client.
  return txt.replace(/\r\n/g, '\n');
};

module.exports = async function modifyUserData({
  loadCurrentData,
  reqBody,
}) {
  const {
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
  } = reqBody;
  let missingRequiredItems;
  
  if (!action) return { error: { code: 400, msg: 'Missing `action`' } };
  else if (!['add', 'edit', 'delete'].includes(action)) return { error: { code: 400, msg: `The \`action\` "${action}" is unknown` } };
  else if (!type) return { error: { code: 400, msg: 'Missing `type`' } };
  else if (!username && !password) return { error: { code: 400, msg: 'Missing `username` and `password`' } };
  else if (!username) return { error: { code: 400, msg: 'Missing `username`' } };
  else if (!password) return { error: { code: 400, msg: 'Missing `password`' } };
  else if (!['group', 'note', 'preferences'].includes(type)) return { error: { code: 400, msg: `The \`type\` "${type}" is unknown` } };
  else if (type === 'note') {
    let required = ['path', 'title'];
    if (action === 'edit') required.push('oldTitle');
    else if (action === 'delete') required = ['id', 'path'];
    
    missingRequiredItems = getMissingRequiredItems(required, reqBody);
  }
  else if (type === 'group') {
    let required = ['path', 'name'];
    if (action === 'edit') required.push('oldName');
    else if (action === 'delete') required = ['id', 'path'];
    
    missingRequiredItems = getMissingRequiredItems(required, reqBody);
  }
  else if (type === 'preferences') {
    const required = ['prefs'];
    missingRequiredItems = getMissingRequiredItems(required, reqBody);
  }
  
  if (missingRequiredItems) return { error: { code: 400, msg: `Missing ${missingRequiredItems}` } };
  
  const data = await loadCurrentData();
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
      else return { error: { code: 400, msg: `Note with title "${title}" already exists in "${path}"` } };
    }
    else if (type === 'group') {
      const { groups } = getPathNode(notesData, path);
      const nodeId = kebabCase(name);
      
      if (!groups[nodeId]) {
        groups[nodeId] = { ...groupNodeShape(), groupName: name };
        
        logMsg = `Created group "${name}" in "${path}"`;
      }
      else return { error: { code: 400, msg: `The group "${name}" already exists in "${path}"` } };
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
          return { error: { code: 400, msg: `Note with title "${title}" already exists in "${path}"` } };
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
          return { error: { code: 400, msg: `Group "${name}" already exists in "${path}"` } };
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
      
      logMsg = `Updated preferences for ${Object.keys(prefs).map(pref => `"${pref}"`).join(', ')}`;
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
  
  return { data, logMsg };
};
