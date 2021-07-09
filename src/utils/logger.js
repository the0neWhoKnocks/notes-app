require('ulog');
const { NAMESPACE__LOGGER } = require('../constants');
const aL = require('anylogger');
const rootLogger = aL(NAMESPACE__LOGGER);

const logger = (namespace = '') => (namespace)
  ? aL(`${NAMESPACE__LOGGER}:${namespace}`)
  : rootLogger;

module.exports = logger;
