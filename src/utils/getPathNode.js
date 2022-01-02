module.exports = function getPathNode(obj, path) {
  let node;
  let id;
  
  if (obj) {
    path.split('/').forEach(pathNode => {
      const _node = node ? node.groups[pathNode] : obj[pathNode];
      if (_node) node = _node;
      
      id = pathNode;
    });
  }
  
  return { ...node, id };
}
