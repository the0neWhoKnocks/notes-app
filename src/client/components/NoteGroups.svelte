<script>
  import kebabCase from '../../utils/kebabCase';
  import logger from '../../utils/logger';
  import { noteGroups } from '../stores.js';
  import getPathNode from '../utils/getPathNode';
  import NoteGroup from './NoteGroup.svelte';
  
  const log = logger('noteGroups');
  
  function handleCreateGroupClick({ path }) {
    log.info(`CREATE: Group in "${path}"`);
    
    noteGroups.update(data => {
      const { groups } = getPathNode(data, path);
      
      const MOCK_NAME = 'Temp Group Name';
      const nameNdx = Object.keys(groups).length + 1;
      const indexedName = `${MOCK_NAME} ${nameNdx}`;
      
      groups[kebabCase(indexedName)] = { groupName: indexedName, groups: {}, notes: [] };
      
      return data;
    });
  }
  
  function handleCreateNoteClick({ path }) {
    log.info(`CREATE: Note in "${path}"`);
    
    noteGroups.update(data => {
      const node = getPathNode(data, path);
      
      const MOCK_NAME = 'Temp Note Title';
      const nameNdx = node.notes.length + 1;
      const indexedName = `${MOCK_NAME} ${nameNdx}`;
      
      node.notes = [
        ...node.notes,
        { content: 'tempNoteContent', title: indexedName },
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

<section class="full-notes-list" on:click={delegateGroupsClick}>
  <NoteGroup {...$noteGroups.root} />
</section>

<style>
  .full-notes-list {
    width: 20vw;
    overflow: auto;
    min-width: 250px;
    border-right: solid 1px var(--fg-color--app);
  }
</style>
