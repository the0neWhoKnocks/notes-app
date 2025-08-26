module.exports = function parseTags(tagsStr) {
  return tagsStr.split(', ').filter(t => !!t);
};
