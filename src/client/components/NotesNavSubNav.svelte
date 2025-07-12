<script>
  import { BASE_DATA_NODE } from '../../constants';
  import logger from '../../utils/logger';
  import {
    dialogDataForGroup,
    dialogDataForNote,
  } from '../stores.js';
  import Icon, {
    ICON__FILE,
    ICON__FOLDER,
  } from './Icon.svelte';
  import ModifyNav from './ModifyNav.svelte';
  
  export let draft = false;
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
    <ModifyNav {draft} {id} {path} {type} />
  {/if}
  {#if type === 'group'}
    <button
      title="Add Group"
      on:click={addGroup}
    >
      <Icon type={ICON__FOLDER} />
    </button>
    <button
      title="Add Note"
      on:click={addNote}
    >
      <Icon type={ICON__FILE} />
    </button>
  {/if}
</nav>

<style>
  .sub-nav {
    font-size: 0.8em;
    display: flex;
    justify-content: flex-end;
    gap: 0.25em;
  }
  
  .sub-nav button,
  :global(.sub-nav .modify-nav button) {
    width: 1.5em;
    height: 1.5em;
    font-size: 1.2em;
    padding: 0;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  :global(.sub-nav .modify-nav button.is--draft) {
    width: auto;
    padding: 0 0.25em;
  }
  
  .sub-nav > button::after {
    content: '+';
    color: #000;
    font-size: 0.75em;
    position: absolute;
    top: 61%;
    left: 54%;
    transform: translate(-50%, -50%);
  }
</style>
