<script>
  import { onMount } from 'svelte';
  import getPathNode from '../../utils/getPathNode';
  import { noteGroups } from '../stores';
  import NotesNavDrawer from './NotesNavDrawer.svelte';
  import NotesNavGroup from './NotesNavGroup.svelte';
  
  let navRef;
  
  let groupsData;
  noteGroups.subscribe(async data => {
		groupsData = await data;
	});
  
  $: if (navRef && groupsData) {
    const initialURL = new URL(window.location);
    const notePath = initialURL.searchParams.get('note');
    
    if (notePath) {
      const noteId = notePath.split('/').pop();
      const { notes } = getPathNode(groupsData, notePath);
      // TODO:
      // - ensure nav state reflects current note
      // - update state to display current groups
      // - update state to display current note
      console.log(notes[noteId]);
    }
  }
  
  onMount(() => {
    navRef.addEventListener('click', (ev) => {
      const { target } = ev;
      
      if (target.nodeName === 'A') {
        ev.preventDefault();
        
        const url = new URL(target.href);
        window.history.replaceState({}, '', url);
      }
    });
  });
</script>

<nav class="notes-nav" bind:this={navRef}>
  {#if groupsData}
    <button>All Notes</button>
    <NotesNavDrawer>
      <span slot="label">Groups</span>
      <NotesNavGroup wrap={false} {...groupsData.root} />
    </NotesNavDrawer>
  {/if}
</nav>

<style>
  .notes-nav {
    width: var(--width--notes-nav);
    overflow: auto;
    padding: 0.5em;
    border-right: solid 1px var(--color--app--fg);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
  
  .notes-nav > * {
    color: var(--color--app--fg);
    font-size: 1em;
    text-align: left;
    padding: 0;
    border: none;
    background: transparent;
  }
</style>
