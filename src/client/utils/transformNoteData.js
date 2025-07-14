const {
  BASE_DATA_NODE,
  DATA_TYPE__NOTE,
} = require('../../constants');

const tallyGroupNotes = (group) => {
  let count = 0;
  
  group.forEach(({ subGroup }) => {
    if (subGroup) count += tallyGroupNotes(subGroup);
    else count += 1;
  });
  
  return count;
};

module.exports = function transformNoteData(
  data,
  nodeProps,
  parent = BASE_DATA_NODE
) {
  const ret = [];
  const { groups, notes } = data || {};
  const {
    addCount,
    groupComponent,
    itemComponent,
    omitNotes,
    ...extraProps
  } = nodeProps;
  
  if (groups || notes) {
    if (groups) {
      for (const [groupId, group] of Object.entries(groups)) {
        const path = `${parent}/${groupId}`;
        const subGroup = transformNoteData(group, nodeProps, path);
        let groupName = group.groupName;
        
        if (addCount) {
          const count = tallyGroupNotes(subGroup);
          if (count) groupName = `(${count}) ${groupName}`;
        }
        
        ret.push({
          ...extraProps,
          groupName,
          id: groupId,
          nameComponent: groupComponent,
          path,
          subGroup,
        });
      }
    }
    
    if (!omitNotes && notes) {
      for (const [ noteId, note ] of Object.entries(notes)) {
        const path = `${parent}/${noteId}`;
        const noteRef = (note.draft) ? note.draft : note;
        ret.push({
          ...extraProps,
          draft: note.draft,
          id: noteId,
          link: `?note=${window.encodeURIComponent(path)}`,
          name: noteRef.title,
          nameComponent: itemComponent,
          path,
          type: DATA_TYPE__NOTE,
        });
      }
    }
  }
  else if (data[BASE_DATA_NODE]) {
    const path = BASE_DATA_NODE;
    ret.push({
      ...extraProps,
      groupName: '/',
      id: BASE_DATA_NODE,
      nameComponent: groupComponent,
      path,
      subGroup: transformNoteData(data[BASE_DATA_NODE], nodeProps, path),
    });
  }
  
  return ret;
}
