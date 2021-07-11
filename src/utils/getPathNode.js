module.exports = function getPathNode(obj, path) {
  let node;
  
  path.split('/').forEach(group => {
    node = node ? node.groups[group] : obj[group];
  });
  
  return node;
}
