module.exports = function getParams(url) {
  return [...(new URL(url)).searchParams.entries()]
    .reduce((obj, [prop, val]) => {
      obj[prop] = val;
      return obj;
    }, {});
};
