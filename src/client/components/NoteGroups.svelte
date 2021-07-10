<script>
  import { onDestroy } from 'svelte';
  import { ROUTE__API__USER_SET_DATA } from '../../constants';
  import kebabCase from '../../utils/kebabCase';
  import logger from '../../utils/logger';
  import { noteGroups, userData } from '../stores.js';
  import getPathNode from '../utils/getPathNode';
  import postData from '../utils/postData';
  import NoteGroup from './NoteGroup.svelte';
  
  const log = logger('noteGroups');
  
  async function updateData(updatedData, oldData) {
    try {
      await postData(ROUTE__API__USER_SET_DATA, { ...$userData, data: updatedData });
      return updatedData;
    }
    catch ({ message }) {
      alert(message);
      return oldData;
    }
  }
  
  function handleCreateGroupClick({ path }) {
    log.info(`CREATE: Group in "${path}"`);
    
    noteGroups.update(async data => {
      const dataCopy = { ...(await data) }; // TODO - probably want a deep copy
      const { groups } = getPathNode(dataCopy, path);
      
      const MOCK_NAME = 'Temp Group Name';
      const nameNdx = Object.keys(groups).length + 1;
      const indexedName = `${MOCK_NAME} ${nameNdx}`;
      
      groups[kebabCase(indexedName)] = { groupName: indexedName, groups: {}, notes: [] };
      
      return updateData(dataCopy, data);
    });
  }
  
  function handleCreateNoteClick({ path }) {
    log.info(`CREATE: Note in "${path}"`);
    
    noteGroups.update(async data => {
      const dataCopy = { ...(await data) }; // TODO - probably want a deep copy
      const node = getPathNode(dataCopy, path);
      
      const MOCK_NAME = 'Temp Note Title';
      const nameNdx = node.notes.length + 1;
      const indexedName = `${MOCK_NAME} ${nameNdx}`;
      
      node.notes = [
        ...node.notes,
        { content: 'tempNoteContent', title: indexedName },
      ];
      
      return updateData(dataCopy, data);
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
