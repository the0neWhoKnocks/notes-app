<script>
  import { BASE_DATA_NODE } from '../../constants';
  import {
    allTags,
    getNoteBlurbs,
    loadNote,
    noteGroups,
    notesNavFlyoutOpen,
    recentlyViewed,
  } from '../stores.js';
  import getParams from '../utils/getParams';
  import transformNoteData from '../utils/transformNoteData';
  import Icon, { ICON__EYE } from './Icon.svelte';
  import GroupList from './GroupList.svelte';
  import NoteBlurb from './NoteBlurb.svelte';
  import NotesNavItemsToggle from './NotesNavItemsToggle.svelte';
  import NotesNavSubNav from './NotesNavSubNav.svelte';
  import Tag from './Tag.svelte';
  
  let groupsData;
  
  function handleNoteClick(el) {
    const { note } = getParams(el.href);
    
    notesNavFlyoutOpen.set(false);
    loadNote(note);
  }
  
  noteGroups.subscribe((data = {}) => {
		groupsData = transformNoteData(
      data[BASE_DATA_NODE],
      { groupComponent: NotesNavSubNav, itemComponent: NotesNavSubNav }
    );
	});
</script>

<nav class="notes-nav">
  {#if $recentlyViewed && $recentlyViewed.length}
    <section class="recent">
      <NotesNavItemsToggle>
        <svelte:fragment slot="toggleLabel">
          <Icon type={ICON__EYE} /> Recently Viewed
        </svelte:fragment>
        <svelte:fragment slot="toggleItems">
          {#each getNoteBlurbs($recentlyViewed) as item}
            <NoteBlurb {...item} />
          {/each}
        </svelte:fragment>
      </NotesNavItemsToggle>
    </section>
  {/if}
  {#if Object.keys($allTags).length}
    <section class="tags">
      <NotesNavItemsToggle>
        <svelte:fragment slot="toggleLabel">
          <Tag rounded text="&nbsp;" />Tags
        </svelte:fragment>
        <svelte:fragment slot="toggleItems">
          {#each Object.entries($allTags) as [tag, notePaths]}
            <Tag count="({notePaths.length}) " rounded text={tag} />
          {/each}
        </svelte:fragment>
      </NotesNavItemsToggle>
    </section>
  {/if}
  {#if groupsData}
    <section class="notes">
      <NotesNavSubNav root />
      <GroupList
        data={groupsData}
        onItemClick={handleNoteClick}
      />
    </section>
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
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }
  
  :global(.recent .notes-nav-items-toggle__btn .svg-icon) {
    width: 1.9em;
    height: 1.25em;
  }
  :global(.recent .notes-nav-items-toggle__btn::after) {
    color: #fff;
    left: 0.91em;
    transform: translateY(-50%) scale(0.75);
  }
  :global(.notes-nav-items-toggle__items .note-blurb) {
    font-size: 0.8em;
  }
  
  :global(.notes-nav-items-toggle__btn .tag) {
    height: 1em;
  }
  :global(.notes-nav-items-toggle__items .tag) {
    height: 1.2em;
  }
  
  :global(.notes-nav .tag) {
    --tag--bg-color: #eee;
  }
  
  :global(.notes-nav .notes > .sub-nav) {
    padding: 0 var(--nav-spacing);
  }
  
  :global(.notes-nav .group-list.is--root) {
    padding-left: unset;
    display: flex;
    gap: 0.25em;
    flex-direction: column;
  }
  :global(.notes-nav .group[open]:not([empty])::after) {
    top: 2.4em;
    left: 0.5em;
  }
  :global(.notes-nav .group__name .sub-nav),
  :global(.notes-nav .item .sub-nav) {
    opacity: 0.3;
  }
  :global(.notes-nav .group-list .item) {
    padding: 0.3em var(--nav-spacing) 0;
  }
  :global(.notes-nav .group-list .item__label) {
    width: 100%;
  }
  :global(.notes-nav .item .modify-nav button) {
    padding: 0.6em 0.5em;
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
  :global(.notes-nav .group__name:hover .sub-nav),
  :global(.notes-nav .item:hover .sub-nav) {
    opacity: 1;
  }
</style>
