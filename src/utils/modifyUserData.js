// NOTE: Since this file is used by the SW as well as the Server, NodeJS built-ins
// can't be utilized (since WP may package up a huge chunk of code).

const { BASE_DATA_NODE } = require('../constants');
const groupNodeShape = require('../utils/groupNodeShape');
const parseTags = require('../utils/parseTags');
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

function iterateData(data, groupPath, cb) {
  const { groups, notes } = getPathNode(data, groupPath);
  
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
  
  const updatePath = (oldNotePath, newNotePath) => {
    if (deletePath) {
      updated = updated.filter(path => path !== oldNotePath);
    }
    else {
      // chances of duplicate paths should be zero, iterating all just in case
      updated = updated.reduce((arr, path) => {
        if (path === oldNotePath) arr.push(newNotePath);
        return arr;
      }, []);
    }
  };
  
  if (type === 'group') {
    const _path = deletePath || oldParentPath;
    
    iterateData(notesData, _path, ({ note, noteId }) => {
      if (note) {
        if (deletePath) updatePath(`${deletePath}/${id}/${noteId}`);
        else {
          const oldNotePath = `${oldParentPath}/${id}/${noteId}`;
          const newNotePath = `${newParentPath}/${id}/${noteId}`;
          updatePath(oldNotePath, newNotePath);
        }
      }
    });
  }
  else {
    if (deletePath) updatePath(`${deletePath}/${id}`);
    else {
      const oldNotePath = `${oldParentPath}/${id}`;
      const newNotePath = `${newParentPath}/${id}`;
      updatePath(oldNotePath, newNotePath);
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
          const { notes } = getPathNode(notesData, path);
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
          const fTags = parseTags(tags);
          
          // could have just changed the casing of a title
          if (oldTitle.toLowerCase() !== title.toLowerCase()) {
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
            tags: fTags,
            title,
          };
          
          allTags = compileTags(notesData);
          
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
        else if (type === 'recentlyViewed') {
          data.recentlyViewed = recent;
          logMsg = 'Updated recentlyViewed';
        }
        
        break;
      }
      case 'delete': {
        const node = getPathNode(notesData, path);
        const nodeType = `${type}s`; // groups or notes
        
        data.recentlyViewed = updateRecentlyViewed({
          deletePath: path,
          id,
          notesData,
          recent: data.recentlyViewed,
          type,
        });
        
        delete node[nodeType][id];
        
        allTags = compileTags(notesData);
        
        logMsg = `Removed ${type} "${id}" from "${path}"`;
        
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
        const oldNode = getPathNode(notesData, oldParentPath);
        const newNode = getPathNode(notesData, newParentPath);
        const nodeType = `${type}s`;
        const node = oldNode[nodeType][id];
        const exists = !!newNode[nodeType][id];
      
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
        newNode[nodeType][id] = node;
        // delete old note
        delete oldNode[nodeType][id];
        
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
