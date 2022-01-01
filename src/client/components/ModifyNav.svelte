<script>
  import getPathNode from '../../utils/getPathNode';
  import logger from '../../utils/logger';
  import {
    dialogDataForDelete,
    dialogDataForGroup,
    dialogDataForNote,
    noteGroups,
  } from '../stores.js';
  
  export let id = undefined;
  export let path = undefined;
  export let type = undefined;
  
  const log = logger('ModifyNav');
  
  function parsePath() {
    return (path.includes('/')) ? path.split('/').slice(0, -1).join('/') : path;
  }
  
  function deleteItem() {
    const _path = parsePath();
    const { groupName, title } = getPathNode($noteGroups, _path)[`${type}s`][id];
    log.info(`Delete ${type} ${id}`);
    dialogDataForDelete.set({ groupName, id, path: _path, title, type });
  }
  
  function editItem() {
    const _path = parsePath();
    const { content, groupName, title } = getPathNode($noteGroups, _path)[`${type}s`][id];
    
    log.info(`Edit ${type} ${id}`);
    
    if (type === 'note') {
      dialogDataForNote.set({ action: 'edit', content, path: _path, title });
    }
    else if (type === 'group') {
      dialogDataForGroup.set({ action: 'edit', content, name: groupName, path: _path });
    }
  }
</script>

<nav class="modify-nav">
  <button type="button" title="Edit" on:click={editItem}>E</button>
  <button type="button" title="Delete" on:click={deleteItem}>X</button>
</nav>

<style>
  .modify-nav {
    display: flex;
    gap: 0.25em;
  }
  
  .modify-nav button {
    font-size: 0.75em;
    padding: 0.25em 0.5em;
  }
</style>
