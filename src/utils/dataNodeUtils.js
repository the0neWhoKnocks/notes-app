function getPathNode(obj, path, type) {
  let node;
  let id;
  
  if (obj) {
    path.split('/').forEach((pathNode, ndx, arr) => {
      const atEnd = ndx === (arr.length - 1);
      
      if (
        type === 'group'
        || (type === 'note' && !atEnd)
      ) {
        const _node = node ? node.groups[pathNode] : obj[pathNode];
        if (_node) node = _node;
      }
      
      id = pathNode;
    });
  }
  
  const ret = { ...node, id };
  
  if (type === 'group') ret.group = node;
  else ret.note = node.notes[id];
  
  return ret;
}

module.exports = {
  getGroupNode: (...args) => getPathNode(...args, 'group'),
  getNoteNode: (...args) => getPathNode(...args, 'note'),
};
