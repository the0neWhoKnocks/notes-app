<script>
  import logger from '../../utils/logger';
  import { noteGroups } from '../stores.js';
  import getPathNode from '../utils/getPathNode';
  import NoteGroup from './NoteGroup.svelte';
  
  const log = logger('noteGroups');
  
  function handleCreateGroupClick({ path }) {
    log.info(`CREATE: Group in "${path}"`);
    
    noteGroups.update(data => {
      const { groups } = getPathNode(data, path);
      
      groups['tempGroupName'] = { groups: {}, notes: [] };
      
      return data;
    });
  }
  
  function handleCreateNoteClick({ path }) {
    log.info(`CREATE: Note in "${path}"`);
    
    noteGroups.update(data => {
      const node = getPathNode(data, path);
      
      node.notes = [
        ...node.notes,
        { content: 'tempNoteContent', title: 'tempNoteTitle' },
      ];
      
      return data;
    });
  }
  
  function delegateGroupsClick({ target: { dataset } }) {
    if (dataset && dataset.type) {
      switch (dataset.type) {
        case 'createGroupBtn':
        handleCreateGroupClick(dataset);
        break;
        
        case 'createNoteBtn':
        handleCreateNoteClick(dataset);
        break;
      }
    }
  }
  
  // $: console.log($noteGroups);
</script>

<section class="note-groups" on:click={delegateGroupsClick}>
  <NoteGroup {...$noteGroups.root} />
</section>

<style>
  .note-groups {
    width: 20vw;
    overflow: auto;
    min-width: 250px;
    border-right: solid 1px var(--fg-color--app);
  }
</style>
