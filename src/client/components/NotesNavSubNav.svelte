<script>
  import {
    BASE_DATA_NODE,
    DATA_ACTION__ADD,
    DATA_TYPE__GROUP,
  } from '../../constants';
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
  
  let {
    draft = false,
    id = undefined,
    path = BASE_DATA_NODE,
    root = false,
    type = DATA_TYPE__GROUP,
  } = $props();
  
  const log = logger('NotesNavSubNav');
  
  function addGroup() {
    log.info(`ADD: Group in "${path}"`);
    dialogDataForGroup.set({ action: DATA_ACTION__ADD, path });
  }
  
  function addNote() {
    log.info(`ADD: Note in "${path}"`);
    dialogDataForNote.set({ action: DATA_ACTION__ADD, path });
  }
</script>

<nav class="sub-nav">
  {#if !root}
    <ModifyNav {draft} {id} {path} {type} />
  {/if}
  {#if type === DATA_TYPE__GROUP}
    <button
      title="Add Group"
      onclick={addGroup}
    >
      <Icon type={ICON__FOLDER} />
    </button>
    <button
      title="Add Note"
      onclick={addNote}
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
