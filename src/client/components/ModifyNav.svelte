<script>
  import {
    getGroupNode,
    getNoteNode,
  } from '../../utils/dataNodeUtils';
  import logger from '../../utils/logger';
  import {
    dialogDataForDelete,
    dialogDataForGroup,
    dialogDataForMove,
    dialogDataForNote,
    noteGroups,
  } from '../stores.js';
  import Icon, {
    ICON__EDIT,
    ICON__NEW_TAB,
    ICON__TRASH,
  } from './Icon.svelte';
  
  export let draft = false;
  export let id = undefined;
  export let path = undefined;
  export let type = undefined;
  
  const log = logger('ModifyNav');
  
  function deleteItem() {
    let groupName, title;
    
    if (type === 'group') {
      ({ groupName, title } = getGroupNode($noteGroups, path).group);
    }
    else {
      ({ groupName, title } = getNoteNode($noteGroups, path).note);
    }
    
    log.info(`Delete ${type} "${id}"`);
    dialogDataForDelete.set({ groupName, id, path, title, type });
  }
  
  function editItem() {
    const base = { action: 'edit', path };
    
    log.info(`Edit ${type} "${id}"`);
    
    if (type === 'group') {
      const { groupName } = getGroupNode($noteGroups, path).group;
      dialogDataForGroup.set({ ...base, id, name: groupName });
    }
    else {
      const { draft, ...rest } = getNoteNode($noteGroups, path).note;
      let content, fromDraft, tags, title;
      
      if (draft) {
        ({ content, tags, title } = draft);
        fromDraft = true;
      }
      else {
        ({ content, tags, title } = rest);
      }
      
      dialogDataForNote.set({ ...base, content, fromDraft, id, tags, title });
    }
  }
  
  function moveItem() {
    dialogDataForMove.set({ path, type });
  }
</script>

<nav class="modify-nav">
  <button type="button" title="Edit" on:click={editItem}>
    <Icon type="{ICON__EDIT}" />
    {#if draft}
      <div class="modify-nav__draft-txt">Draft</div>
    {/if}
  </button>
  <button type="button" title="Move" on:click={moveItem}>
    <Icon type="{ICON__NEW_TAB}" />
  </button>
  <button type="button" title="Delete" on:click={deleteItem}>
    <Icon type="{ICON__TRASH}" />
  </button>
</nav>

<style>
  .modify-nav {
    display: flex;
    gap: 0.25em;
  }
  
  .modify-nav__draft-txt {
    font-size: 0.8em;
    padding: 0 0.25em;
  }
  
  :global(.modify-nav button) {
    padding: 0.25em;
    display: flex;
    align-items: center;
  }
</style>
