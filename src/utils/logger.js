const ulog = require('ulog');
// NOTE: Overriding for both Server and Client because of the noted issues.
// - If the Client issue ever gets fixed, the Server only logic for
//   `process.env.FOR_CLIENT_BUNDLE` will have to be reimplemented.
// Issues:
// - Client: https://github.com/Download/ulog/issues/69
// - Format padding: https://github.com/Download/ulog/issues/68
ulog.config.log_format = 'lvl noPadName message';
if (process.env.FOR_CLIENT_BUNDLE) {
  ulog.config.log = 'debug';
  window.localStorage.log = ulog.config.log;
  window.localStorage.log_format = ulog.config.log_format;
}
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
