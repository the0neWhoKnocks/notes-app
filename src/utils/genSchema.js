const {
  BASE_DATA_NODE,
  DATA_TYPE__ALL,
  DATA_TYPE__GROUP,
  DATA_TYPE__NOTE,
  DATA_TYPE__NOTES,
  DATA_TYPE__PREFS,
  DATA_TYPE__RECENT,
} = require('../constants');
const groupNodeShape = require('./groupNodeShape');

module.exports = function genSchema(type) {
  const defaultObj = {};
  const notesTypes = [
    DATA_TYPE__ALL,
    DATA_TYPE__GROUP,
    DATA_TYPE__NOTE,
    DATA_TYPE__NOTES,
    DATA_TYPE__RECENT,
  ];
  const prefsTypes = [
    DATA_TYPE__ALL,
    DATA_TYPE__PREFS,
  ];
  
  if (notesTypes.includes(type)) {
    Object.assign(defaultObj, {
      allTags: {},
      notesData: {
        [BASE_DATA_NODE]: groupNodeShape(),
      },
      recentlyViewed: [],
    });
  }
  
  if (prefsTypes.includes(type)) {
    Object.assign(defaultObj, { [DATA_TYPE__PREFS]: {} });
  }
  
  return { defaultObj, notesTypes, prefsTypes };
};
