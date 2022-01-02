const groupNodeShape = require('../utils/groupNodeShape');
const getPathNode = require('./getPathNode');
const kebabCase = require('./kebabCase');

const getMissingRequiredItems = (required, propObj) => {
  const groupedProps = required.reduce((obj, prop) => {
    const _prop = prop.split('?')[1] || prop;
    const arr = (prop.startsWith('?') && prop.endsWith('?')) ? obj.conditionals : obj.required;
    if (!propObj[_prop]) arr.push(_prop);
    return obj;
  }, { conditionals: [], required: [] });
  const onlyConditionals = required.every(i => i.startsWith('?') && i.endsWith('?'));
  const reqMsg = groupedProps.required
    .map(prop => `\`${prop}\``)
    .join(` and `);
  const condMsg = groupedProps.conditionals
    .map(prop => `\`${prop}\``)
    .join(` or `);  
  let msg = '';

  if (reqMsg && condMsg) msg = `${reqMsg} or ${condMsg}`;
  else if (reqMsg && !condMsg) msg = reqMsg;
  else if (
    condMsg
    && onlyConditionals
    && groupedProps.conditionals.length === required.length
  ) msg = condMsg;

  return msg;
};

const sanitizeContent = (txt) => {
  // While editing on the Client, only newline characters are present, but
  // during the submission proccess (either via the Form or Post), carriage
  // return characters are added as well, which messes with diff checking on the
  // Client.
  return txt.replace(/\r\n/g, '\n');
};

const sortArrayByPropVal = (arr, orderArr) => {
  const _arr = [...arr];
  const sortedArr = [];

  orderArr.forEach(([ prop, value ]) => {
    const tempArr = [];

    for (let i=_arr.length - 1; i>=0; i--) {
      if (_arr[i][prop] === value) {
        tempArr.push(_arr[i]);
        _arr.splice(i, 1);
      }
    }
    sortedArr.push(...tempArr.reverse());
  });

  return [...sortedArr, ..._arr];
};

const sortObjByKeys = (obj) => {
  return Object.keys(obj).sort().reduce((sorted, prop) => {
    const curr = obj[prop];
    sorted[prop] = (!Array.isArray(curr) && curr !== null && typeof curr === 'object')
      ? sortObjByKeys(curr)
      : curr;
    return sorted;
  }, {});
};

module.exports = async function modifyUserData({
  loadCurrentData,
  reqBody,
}) {
  const {
    action,
    content,
    id,
    importedData,
    name,
    offlineChanges,
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
  else if (![
    'add', 
    'applyOfflineChanges', 
    'edit', 
    'delete',
    'importData',
  ].includes(action)) return { error: { code: 400, msg: `The \`action\` "${action}" is unknown` } };
  else if (!type) return { error: { code: 400, msg: 'Missing `type`' } };
  else if (!username && !password) return { error: { code: 400, msg: 'Missing `username` and `password`' } };
  else if (!username) return { error: { code: 400, msg: 'Missing `username`' } };
  else if (!password) return { error: { code: 400, msg: 'Missing `password`' } };
  else if (![
    'all',
    'group', 
    'note',
    'preferences',
  ].includes(type)) return { error: { code: 400, msg: `The \`type\` "${type}" is unknown` } };
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
  else if (type === 'all') {
    const required = ['?importedData?', '?offlineChanges?'];
    missingRequiredItems = getMissingRequiredItems(required, reqBody);
  }
  
  if (missingRequiredItems) return { error: { code: 400, msg: `Missing ${missingRequiredItems}` } };
  
  let data = await loadCurrentData();
  const notesData = data.notesData;
  let logMsg = 'Data set';
  
  switch (action) {
    case 'add': {
      const creationDate = Date.now();
      
      if (type === 'note') {
        const { notes } = getPathNode(notesData, path);
        const nodeId = kebabCase(title);
        
        if (!notes[nodeId]) {
          notes[nodeId] = {
            content: sanitizeContent(content) || '',
            created: creationDate,
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
          groups[nodeId] = { 
            ...groupNodeShape(),
            created: creationDate,
            groupName: name,
          };
          
          logMsg = `Created group "${name}" in "${path}"`;
        }
        else return { error: { code: 400, msg: `The group "${name}" already exists in "${path}"` } };
      }
      
      break;
    }
    case 'edit': {
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
      
      break;
    }
    case 'delete': {
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
      
      break;
    }
    case 'applyOfflineChanges': {
      try {
        const msgLines = [];
        
        Object.keys(offlineChanges).forEach((dataType) => {
          Object.keys(offlineChanges[dataType]).forEach((changeType) => {
            let orderedChanges = offlineChanges[dataType][changeType];
            
            if (changeType === 'modified') {
              // Any title changes need to come first to rename any existing 
              // notes, otherwise any further updates will fail.
              orderedChanges = sortArrayByPropVal(orderedChanges, [['prop', 'title']]);
            }
            
            orderedChanges.forEach(({ path: _path, ...changeData }) => {
              const objPath = _path.split('/');
              const item = objPath.pop();
              
              switch (dataType) {
                case 'notes': {
                  const objNode = objPath.reduce((obj, key) => obj[key], notesData);

                  switch (changeType) {
                    case 'added': {
                      if (objNode[item]) {
                        return {
                          error: {
                            code: 500,
                            msg: `Could not add "${item}", it already exists.`,
                          },
                        };
                      }
                      
                      objNode[item] = changeData.obj;
                      msgLines.push(`Added "${item}"`);
                      break;
                    }
                    case 'modified': {
                      const { from, prop, to } = changeData;
                      let nodeId = (prop === 'title')
                        ? kebabCase(from)
                        : kebabCase(item);
                      
                      objNode[nodeId][prop] = to;
                      
                      if (prop === 'title') {
                        const newNodeId = kebabCase(to);
                        
                        if (objNode[newNodeId]) {
                          return {
                            error: {
                              code: 500,
                              msg: `Could not rename "${from}" to "${to}", "${to}" already exists.`,
                            },
                          };
                        }
                        
                        objNode[newNodeId] = objNode[nodeId];
                        delete objNode[nodeId];
                        msgLines.push(`Renamed "${from}" to "${to}"`);
                      }
                      else msgLines.push(`Updated "${item}.${prop}"`);
                      
                      break;
                    }
                    case 'removed': { 
                      delete objNode[item];
                      msgLines.push(`Removed "${item}"`);
                      break;
                    }
                  }

                  break;
                }
                case 'prefs': {
                  switch (changeType) {
                    case 'modified': {
                      const { from, prop, to } = changeData;
                      data.preferences[prop] = to;
                      msgLines.push(`Updated preference "${prop}" from "${from}" to "${to}"`);
                      break;
                    }
                  }
                }
              }
            });
          });
        });
        
        logMsg = `Applied offline changes:\n  - ${msgLines.join('\n  - ')}`;
      }
      catch (err) {
        return { error: { code: 500, msg: err.stack } };
      }
      
      break;
    }
    case 'importData': {
      data = { ...importedData.data };
      logMsg = `Imported data for "${username}"`;
      break;
    }
  }
  
  data = sortObjByKeys(data);
  
  return { data, logMsg };
};
