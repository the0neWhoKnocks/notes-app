<script>
  import { BASE_DATA_NODE } from '../../constants';
  import logger from '../../utils/logger';
  import {
    dialogDataForGroup,
    dialogDataForNote,
  } from '../stores.js';
  import ModifyNav from './ModifyNav.svelte';
  
  export let id = undefined;
  export let path = BASE_DATA_NODE;
  export let root = false;
  export let type = 'group';
  
  const log = logger('NotesNavSubNav');
  
  function addGroup() {
    log.info(`ADD: Group in "${path}"`);
    dialogDataForGroup.set({ action: 'add', path });
  }
  
  function addNote() {
    log.info(`ADD: Note in "${path}"`);
    dialogDataForNote.set({ action: 'add', path });
  }
</script>

<nav class="sub-nav">
  {#if !root}
    <ModifyNav {id} {path} {type} />
  {/if}
  {#if type === 'group'}
    <button
      title="Add Group"
      on:click={addGroup}
    >+ Group</button>
    <button
      title="Add Note"
      on:click={addNote}
    >+ Note</button>
  {/if}
</nav>

<style>
  .sub-nav {
    font-size: 0.8em;
    display: flex;
    justify-content: flex-end;
    gap: 0.25em;
  }
  
  .sub-nav button {
    padding: 0.25em 0.5em;
  }
</style>
