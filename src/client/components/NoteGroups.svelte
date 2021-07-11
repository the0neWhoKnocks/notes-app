<script>
  import { onDestroy } from 'svelte';
  import logger from '../../utils/logger';
  import {
    groupDialogData,
    noteDialogData,
    noteGroups,
  } from '../stores.js';
  import NoteGroup from './NoteGroup.svelte';
  
  const log = logger('noteGroups');
  
  function handleAddGroupClick({ path }) {
    log.info(`ADD: Group in "${path}"`);
    groupDialogData.set({ action: 'add', path });
  }
  
  function handleAddNoteClick({ path }) {
    log.info(`ADD: Note in "${path}"`);
    noteDialogData.set({ action: 'add', path });
  }
  
  function delegateGroupsClick({ target: { dataset } }) {
    if (dataset && dataset.type) {
      switch (dataset.type) {
        case 'addGroupBtn':
          handleAddGroupClick(dataset);
          break;
        
        case 'addNoteBtn':
          handleAddNoteClick(dataset);
          break;
      }
    }
  }
  
  let groupsData;
	const unsubGroups = noteGroups.subscribe(async data => {
		groupsData = await data;
	});

	onDestroy(unsubGroups);
</script>

<section class="full-notes-list" on:click={delegateGroupsClick}>
  {#if groupsData}
    <NoteGroup {...groupsData.root} />
  {/if}
</section>

<style>
  .full-notes-list {
    width: 20vw;
    overflow: auto;
    min-width: 250px;
    border-right: solid 1px var(--fg-color--app);
  }
</style>
