<script>
  import getPathNode from '../../utils/getPathNode';
  import logger from '../../utils/logger';
  import parsePath from '../../utils/parsePath';
  import {
    dialogDataForDelete,
    dialogDataForGroup,
    dialogDataForMove,
    dialogDataForNote,
    noteGroups,
  } from '../stores.js';
  
  export let id = undefined;
  export let path = undefined;
  export let type = undefined;
  
  const log = logger('ModifyNav');
  
  function deleteItem() {
    const { rawPrefix } = parsePath(path);
    const { groupName, title } = getPathNode($noteGroups, rawPrefix)[`${type}s`][id];
    log.info(`Delete ${type} "${id}"`);
    dialogDataForDelete.set({ groupName, id, path: rawPrefix, title, type });
  }
  
  function editItem() {
    const { rawPrefix } = parsePath(path);
    const { content, groupName, tags, title } = getPathNode($noteGroups, rawPrefix)[`${type}s`][id];
    
    log.info(`Edit ${type} "${id}"`);
    
    if (type === 'note') {
      dialogDataForNote.set({ action: 'edit', content, id, path: rawPrefix, tags, title });
    }
    else if (type === 'group') {
      dialogDataForGroup.set({ action: 'edit', content, id, name: groupName, path: rawPrefix });
    }
  }
  
  function moveItem() {
    dialogDataForMove.set({ path, type });
  }
</script>

<nav class="modify-nav">
  <button type="button" title="Edit" on:click={editItem}>E</button>
  <button type="button" title="Move" on:click={moveItem}>M</button>
  <button type="button" title="Delete" on:click={deleteItem}>D</button>
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
