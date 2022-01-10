const { BASE_DATA_NODE } = require('../constants');

module.exports = function parsePath(path) {
  const parts = path.split('/');
  const ret = {};
  
  if (path.includes('/')) {
    ret.rawPrefix = parts.slice(0, -1).join('/');
    ret.prefix = ret.rawPrefix.replace(BASE_DATA_NODE, '') + '/';
    ret.suffix = parts.pop();
  }
  else {
    ret.rawPrefix = path;
    ret.prefix = path.replace(BASE_DATA_NODE, '') + '/';
  }
  
  return ret;
}
