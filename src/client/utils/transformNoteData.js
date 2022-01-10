const { BASE_DATA_NODE } = require('../../constants');

module.exports = function transformNoteData(
  data,
  nodeProps,
  parent = BASE_DATA_NODE
) {
  const ret = [];
  const { groups, notes } = data || {};
  const {
    groupComponent,
    itemComponent,
    omitNotes,
    ...extraProps
  } = nodeProps;
  
  if (groups || notes) {
    if (groups) {
      for (const [groupId, group] of Object.entries(groups)) {
        const path = `${parent}/${groupId}`;
        ret.push({
          ...extraProps,
          groupName: group.groupName,
          id: groupId,
          nameComponent: groupComponent,
          path,
          subGroup: transformNoteData(group, nodeProps, path),
        });
      }
    }
    
    if (!omitNotes && notes) {
      for (const [noteId, note] of Object.entries(notes)) {
        const path = `${parent}/${noteId}`;
        ret.push({
          ...extraProps,
          id: noteId,
          link: `?note=${window.encodeURIComponent(path)}`,
          name: note.title,
          nameComponent: itemComponent,
          path,
          type: 'note',
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
