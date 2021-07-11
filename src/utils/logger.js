if (!process.env.FOR_CLIENT_BUNDLE) {
  process.env.log_format = 'lvl noPadName message';
}

const ulog = require('ulog');
ulog.use({
  use: [ require('ulog/mods/formats') ],
  formats: {
    noPadName: () => {
      const fmt = (rec) => rec.name;
      fmt.color = 'logger';
      return fmt;
    },
  },
});

const { NAMESPACE__LOGGER } = require('../constants');
const aL = require('anylogger');
const rootLogger = aL(NAMESPACE__LOGGER);

const logger = (namespace = '') => (namespace)
  ? aL(`${NAMESPACE__LOGGER}:${namespace}`)
  : rootLogger;

module.exports = logger;
