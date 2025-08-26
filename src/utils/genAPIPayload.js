const {
  DATA_ACTION__ADD,
  DATA_ACTION__EDIT,
  DATA_TYPE__NOTE,
} = require('../constants');
const { getNoteNode } = require('./dataNodeUtils');

exports.EP__SET__USER_DATA = 'setUserData';

// Ensures that Server and SW response shapes stay in sync.
exports.default = function genAPIPayload({ data, endpoint, ...rest }) {
  switch (endpoint) {
    case exports.EP__SET__USER_DATA: {
      const { action, nodeId, nodePath, type } = rest;
      
      if (
        type === DATA_TYPE__NOTE
        && (
          action === DATA_ACTION__ADD
          || action === DATA_ACTION__EDIT
        )
      ) {
        const nPath = (action === DATA_ACTION__ADD) ? `${nodePath}/${nodeId}` : nodePath;
        const { note } = getNoteNode(data.notesData, nPath);
        return { ...data, newData: note, newPath: nPath };
      }
      else return { ...data };
    }
  }
};
