module.exports = function kebabCase(str) {
  if (!str) return str;
  
  return str
    .trim()
    .toLocaleLowerCase()
    // kill any non alpha-numeric chars (but leave spaces and hyphens)
    .replace(/[^a-zA-Z0-9- ]/g, '')
    // capitalize any words with a leading space (and replace the space with a hyphen)
    .replace(/\s+(\w)?/gi, (m, l) => `-${l.toLowerCase()}`);
}
