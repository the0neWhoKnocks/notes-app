module.exports = function getPathNode(obj, path) {
  let node;
  
  if (obj) {
    path.split('/').forEach(group => {
      const _node = node ? node.groups[group] : obj[group];
      if (_node) node = _node;
    });
  }
  
  return node;
}
