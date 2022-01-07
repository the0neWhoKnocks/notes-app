<script>
  import { cubicOut } from 'svelte/easing';
  import {
    currentNote,
    getNoteBlurbs,
    initialUserDataLoaded,
    loadNote,
    recentlyViewed,
    recentlyViewedOpen,
    tagsList,
  } from '../stores';
  import NoteBlurb from './NoteBlurb.svelte';
  
  let recentItems;
  
  const toggle = (_, { type } = {}) => {
    return {
      duration: 150,
      css: t => {
        const perc = (t * 100);
        const eq = type === 'show'
          ? -100 + perc
          : 0 - (100 - perc);
        
        return `
          transform: translateX(${eq}%);
        `;
      },
      easing: cubicOut,
    };
  };
  
  function handleCloseEnd() {
    recentlyViewedOpen.set(false);
  }
  
  function handleClick({ target: { dataset: { path } } }) {
    if (path) loadNote(path);
  }
  
  $: if (
    $initialUserDataLoaded
    && (!$currentNote && !$tagsList)
    && $recentlyViewed
  ) {
    recentItems = getNoteBlurbs($recentlyViewed);
    recentlyViewedOpen.set(true);
  }
  else recentItems = undefined;
</script>

{#if recentItems}
  <nav
    class="recently-viewed"
    in:toggle={{ type: 'show' }}
    out:toggle={{}}
    on:outroend={handleCloseEnd}
    on:click={handleClick}
  >
    <h3>Recently Viewed</h3>
    {#each recentItems as item}
      <NoteBlurb {...item} />
    {/each}
  </nav>
{/if}

<style>
  .recently-viewed {
    width: 15em;
    color: var(--color--app--fg);
    overflow-y: auto;
    padding: 1em;
    border-right: solid 1px;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }
  
  .recently-viewed h3 {
    margin: 0;
  }
</style>
