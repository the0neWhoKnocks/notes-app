const { PATH__DATA } = require('../../constants');

module.exports = function getUserDataPath(encryptedUsername) {
  return {
    notesFName: 'notes.json',
    oldFormat: `${PATH__DATA}/data_${encryptedUsername}.json`,
    prefsFName: 'prefs.json',
    userDataPath: `${PATH__DATA}/user_${encryptedUsername}`,
  };
};
