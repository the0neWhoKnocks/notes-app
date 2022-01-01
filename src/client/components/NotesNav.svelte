<script context="module">
  import { BASE_DATA_NODE } from '../../constants';
  import getParams from '../utils/getParams';
  import NotesNavSubNav from './NotesNavSubNav.svelte';

  const formatData = ({ groups, notes } = {}, parent = BASE_DATA_NODE) => {
    const ret = [];
    
    if (groups) {
      for (const [groupId, group] of Object.entries(groups)) {
        const path = `${parent}/${groupId}`;
        ret.push({
          groupName: group.groupName,
          id: groupId,
          nameComponent: NotesNavSubNav,
          path,
          subGroup: formatData(group, path),
        });
      }
    }
    
    if (notes) {
      for (const [noteId, note] of Object.entries(notes)) {
        const path = `${parent}/${noteId}`;
        ret.push({
          id: noteId,
          link: `?note=${window.encodeURIComponent(path)}`,
          name: note.title,
          path,
        });
      }
    }
    
    return ret;
  };
</script>
<script>
  import getPathNode from '../../utils/getPathNode';
  import {
    currentNote,
    noteGroups,
    notesNavFlyoutOpen,
    updateHistory,
  } from '../stores.js';
  import GroupList from './GroupList.svelte';
  
  let groupsData;
  
  function handleItemClick(el) {
    const { dataset: { id, path }, href } = el;
    const _path = `${BASE_DATA_NODE}${path}`;
    const noteData = getPathNode($noteGroups, _path).notes[id];
    
    notesNavFlyoutOpen.set(false);
    currentNote.set({ ...noteData, id, path: _path });
    updateHistory({ params: getParams(href) });
  }
  
  noteGroups.subscribe((data = {}) => {
		groupsData = formatData(data[BASE_DATA_NODE]);
	});
</script>

<nav class="notes-nav">
  {#if groupsData}
    <NotesNavSubNav root />
    <GroupList
      data={groupsData}
      onItemClick={handleItemClick}
    />
  {/if}
</nav>

<style>
  :root {
    --nav-spacing: 0.25em;
  }

  .notes-nav {
    height: 100%;
    overflow: auto;
    padding: 0.5em;
    border-right: solid 1px var(--color--app--fg);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
  
  :global(.notes-nav > .sub-nav) {
    padding: 0 var(--nav-spacing);
  }
  
  :global(.notes-nav .group-list.is--root) {
    padding-left: unset;
  }
  :global(.notes-nav .group-list > *) {
    margin-top: var(--nav-spacing);
  }
  :global(.notes-nav .group[open]:not([empty])::after) {
    top: 2.4em;
    left: 0.5em;
  }
  :global(.notes-nav .group__name .sub-nav) {
    opacity: 0.3;
  }
  :global(.notes-nav .group-list .item) {
    padding: 0 var(--nav-spacing);
  }
  :global(.notes-nav .group__name) {
    padding: var(--nav-spacing);
    border-radius: var(--nav-spacing);
    background: rgba(0, 0, 0, 0.05);
  }
  :global(.notes-nav .group__name .group__name-wrapper .indicator) {
    width: auto;
    height: auto;
    font-size: 1rem;
    top: 57%;
    left: 0.75em;
    right: unset;
  }
  :global(.notes-nav .group__name:hover .sub-nav) {
    opacity: 1;
  }
</style>
