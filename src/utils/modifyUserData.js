// NOTE: Since this file is used by the SW as well as the Server, NodeJS built-ins
// can't be utilized (since WP may package up a huge chunk of code).

const { BASE_DATA_NODE } = require('../constants');
const groupNodeShape = require('../utils/groupNodeShape');
const parseTags = require('../utils/parseTags');
const { getGroupNode, getNoteNode } = require('./dataNodeUtils');
const kebabCase = require('./kebabCase');
const parsePath = require('./parsePath');

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

function iterateData(data, groupPath, cb) {
  const { groups, notes } = getGroupNode(data, groupPath);
  
  if (groups) {
    for (const [groupId, group] of Object.entries(groups)) {
      if (cb) cb({ group, groupId, groupPath });
      iterateData(data, `${groupPath}/${groupId}`, cb);
    }
  }
  
  if (notes) {
    for (const [noteId, note] of Object.entries(notes)) {
      if (cb) cb({ groupPath, note, noteId });
    }
  }
}

function compileTags(notesData) {
  const tagsObj = {};
  
  iterateData(notesData, BASE_DATA_NODE, ({ groupPath, note, noteId }) => {
    if (note && note.tags) {
      note.tags.forEach((tag) => {
        const path = `${groupPath}/${noteId}`;
        if (!tagsObj[tag]) tagsObj[tag] = [];
        if (!tagsObj[tag].includes(path)) tagsObj[tag].push(path);
      });
    }
  });
  
  return tagsObj;
}

const updateRecentPath = ({ arr, newPath, oldPath }) => {
  let _arr = [...arr];
  
  if (!newPath) _arr = _arr.filter(path => path !== oldPath);
  else {
    const ndx = _arr.indexOf(oldPath);
    if (ndx > -1) _arr.splice(ndx, 1, newPath);
  }
  
  return _arr;
};

function updateRecentlyViewed({
  deletePath,
  id,
  oldParentPath,
  newParentPath,
  notesData,
  recent,
  type,
}) {
  let updated = [...recent];
  
  if (type === 'group') {
    const _path = deletePath || oldParentPath;
    
    iterateData(notesData, _path, ({ note, noteId }) => {
      if (note) {
        if (deletePath) {
          updated = updateRecentPath({
            arr: updated,
            oldPath: `${deletePath}/${id}/${noteId}`,
          });
        }
        else {
          updated = updateRecentPath({
            arr: updated,
            newPath: `${newParentPath}/${id}/${noteId}`,
            oldPath: `${oldParentPath}/${id}/${noteId}`,
          });
        }
      }
    });
  }
  else {
    if (deletePath) {
      updated = updateRecentPath({
        arr: updated,
        oldPath: `${deletePath}/${id}`,
      });
    }
    else {
      updated = updateRecentPath({
        arr: updated,
        newPath: `${newParentPath}/${id}`,
        oldPath: `${oldParentPath}/${id}`,
      });
    }
  }
  
  return updated;
}

const finalizeData = (data, logMsg) => ({
  data: sortObjByKeys(data),
  logMsg,
});

module.exports = async function modifyUserData({
  loadCurrentData,
  reqBody,
}) {
  try {
    const {
      action,
      content,
      id,
      importedData,
      name,
      newParentPath,
      offlineChanges,
      oldName,
      oldParentPath,
      oldTitle,
      password,
      path,
      prefs,
      recent,
      tags,
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
      'move',
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
      'recentlyViewed',
    ].includes(type)) return { error: { code: 400, msg: `The \`type\` "${type}" is unknown` } };
    else if (type === 'note') {
      let required = ['path', 'title'];
      
      switch (action) {
        case 'edit': {
          required.push('oldTitle');
          break;
        }
        case 'delete': {
          required = ['id', 'path'];
          break;
        }
        case 'move': {
          required = ['id', 'oldParentPath', 'newParentPath', 'type'];
          break;
        }
      }
      
      missingRequiredItems = getMissingRequiredItems(required, reqBody);
    }
    else if (type === 'group') {
      let required = ['path', 'name'];
      
      switch (action) {
        case 'edit': {
          required.push('oldName');
          break;
        }
        case 'delete': {
          required = ['id', 'path'];
          break;
        }
        case 'move': {
          required = ['id', 'oldParentPath', 'newParentPath', 'type'];
          break;
        }
      }
      
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
    let allTags = JSON.parse(JSON.stringify(data.allTags));
    const notesData = JSON.parse(JSON.stringify(data.notesData));
    let logMsg = 'Data set';
    
    switch (action) {
      case 'add': {
        const creationDate = Date.now();
        
        if (type === 'note') {
          const { notes } = getNoteNode(notesData, `${path}/${id}`);
          const nodeId = kebabCase(title);
          
          if (!notes[nodeId]) {
            const fTags = parseTags(tags);
            
            notes[nodeId] = {
              content: sanitizeContent(content) || '',
              created: creationDate,
              tags: fTags,
              title,
            };
            
            allTags = compileTags(notesData);
            
            logMsg = `Created note "${title}" in "${path}"`;
          }
          else return { error: { code: 400, msg: `Note with title "${title}" already exists in "${path}"` } };
        }
        else if (type === 'group') {
          const { groups } = getGroupNode(notesData, path);
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
          const { rawPrefix: groupPath } = parsePath(path);
          const { note, notes } = getNoteNode(notesData, path);
          let nodeId = kebabCase(oldTitle);
          const oldNote = { ...note };
          const fTags = parseTags(tags);
          
          // if the only thing that changed in the title was the casing, no need to update
          if (oldTitle.toLowerCase() !== title.toLowerCase()) {
            const newNodeId = kebabCase(title);
            if (notes[newNodeId]) {
              return { error: { code: 400, msg: `Note with title "${title}" already exists in "${path}"` } };
            }
            
            data.recentlyViewed = updateRecentPath({
              arr: data.recentlyViewed,
              newPath: `${groupPath}/${newNodeId}`,
              oldPath: path,
            });
            
            delete notes[nodeId];
            nodeId = newNodeId;
          }
          
          notes[nodeId] = {
            ...oldNote,
            content: sanitizeContent(content) || '',
            modified: Date.now(),
            tags: fTags,
            title,
          };
          
          allTags = compileTags(notesData);
          
          logMsg = `Updated note "${title}" in "${groupPath}"`;
        }
        else if (type === 'group') {
          const { rawPrefix: parentPath } = parsePath(path)
          const { groups } = getGroupNode(notesData, parentPath);
          let nodeId = kebabCase(oldName);
          const groupCopy = JSON.parse(JSON.stringify(groups[nodeId]));
          
          if (oldName.toLowerCase() !== name.toLowerCase()) {
            const newNodeId = kebabCase(name);
            if (groups[newNodeId]) {
              return { error: { code: 400, msg: `Group "${name}" already exists in "${path}"` } };
            }
            
            data.recentlyViewed = data.recentlyViewed.map((notePath) => {
              const oldGroupPath = `${path}/`;
              if (notePath.startsWith(oldGroupPath)) {
                const [,remainingPath] = notePath.split(oldGroupPath);
                return `${parentPath}/${newNodeId}/${remainingPath}`;
              }
              
              return notePath;
            });
            
            delete groups[nodeId];
            nodeId = newNodeId;
          }
          
          groups[nodeId] = {
            ...groupCopy,
            groupName: name,
          };
          
          allTags = compileTags(notesData);
          
          logMsg = `Renamed group from "${oldName}" to "${name}" in "${parentPath}"`;
        }
        else if (type === 'preferences') {
          data.preferences = {
            ...data.preferences,
            ...prefs,
          };
          
          logMsg = `Updated preferences for ${Object.keys(prefs).map(pref => `"${pref}"`).join(', ')}`;
        }
        else if (type === 'recentlyViewed') {
          data.recentlyViewed = recent;
          logMsg = 'Updated recentlyViewed';
        }
        
        break;
      }
      case 'delete': {
        const { rawPrefix: parentPath } = parsePath(path);
        const nodeItems = (type === 'group')
          ? getGroupNode(notesData, parentPath).groups
          : getNoteNode(notesData, path).notes;
        
        data.recentlyViewed = updateRecentlyViewed({
          deletePath: parentPath,
          id,
          notesData,
          recent: data.recentlyViewed,
          type,
        });
        
        delete nodeItems[id];
        
        allTags = compileTags(notesData);
        
        logMsg = `Removed ${type} "${id}" from "${parentPath}"`;
        
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
        return finalizeData(
          importedData.data,
          `Imported data for "${username}"`
        );
      }
      case 'move': {
        let oldNodeItems, newNodeItems;
        if (type === 'group') {
          oldNodeItems = getGroupNode(notesData, oldParentPath).groups;
          newNodeItems = getGroupNode(notesData, newParentPath).groups;
        }
        else {
          oldNodeItems = getNoteNode(notesData, `${oldParentPath}/${id}`).notes;
          newNodeItems = getNoteNode(notesData, `${newParentPath}/${id}`).notes;
        }
        
        const node = oldNodeItems[id];
        const exists = !!newNodeItems[id];
      
        if (exists) {
          return { error: { code: 400, msg: `${type} "${id}" already exists, move aborted.` } };
        }
        
        data.recentlyViewed = updateRecentlyViewed({
          id,
          newParentPath,
          notesData,
          oldParentPath,
          recent: data.recentlyViewed,
          type,
        });
        
        // move to new group
        newNodeItems[id] = node;
        // delete old reference
        delete oldNodeItems[id];
        
        allTags = compileTags(notesData);
        
        logMsg = `Moved ${type} from "${oldParentPath}/${id}" to "${newParentPath}/${id}"`;
        
        break;
      }
    }
    
    // NOTE: Comment out the below lines when testing new/fragile code that could
    // corrupt the data in some way.
    data.allTags = allTags;
    data.notesData = notesData;
    
    return finalizeData(data, logMsg);
  }
  catch (err) {
    return { error: { code: 500, msg: err.stack } };
  }
};
