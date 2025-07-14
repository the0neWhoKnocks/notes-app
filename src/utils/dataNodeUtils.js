const {
  DATA_TYPE__GROUP,
  DATA_TYPE__NOTE,
} = require('../constants');

function getPathNode(obj, path, type) {
  let node;
  let id;
  
  if (obj) {
    path.split('/').forEach((pathNode, ndx, arr) => {
      const atEnd = ndx === (arr.length - 1);
      
      if (
        type === DATA_TYPE__GROUP
        || (type === DATA_TYPE__NOTE && !atEnd)
      ) {
        const _node = node ? node.groups[pathNode] : obj[pathNode];
        if (_node) node = _node;
      }
      
      id = pathNode;
    });
  }
  
  const ret = { ...node, id };
  
  if (type === DATA_TYPE__GROUP) ret[DATA_TYPE__GROUP] = node;
  else ret[DATA_TYPE__NOTE] = node.notes[id];
  
  return ret;
}

module.exports = {
  getGroupNode: (...args) => getPathNode(...args, DATA_TYPE__GROUP),
  getNoteNode: (...args) => getPathNode(...args, DATA_TYPE__NOTE),
};
