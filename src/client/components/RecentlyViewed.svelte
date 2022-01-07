<script>
  import { cubicOut } from 'svelte/easing';
  import { BASE_DATA_NODE } from '../../constants';
  import getPathNode from '../../utils/getPathNode';
  import {
    currentNote,
    initialUserDataLoaded,
    loadNote,
    noteGroups,
    recentlyViewed,
    recentlyViewedOpen,
    tagsList,
  } from '../stores';
  
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
    recentItems = $recentlyViewed.map((path) => {
      const { id, notes } = getPathNode($noteGroups, path);
      return {
        path,
        subTitle: path.replace(BASE_DATA_NODE, ''),
        title: notes[id].title,
      };
    });
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
    {#each recentItems as {path, subTitle, title}}
      <button
        type="button"
        class="recently-viewed__item"
        data-path={encodeURIComponent(path)}
      >
        <b>{title}</b>
        <sub>{subTitle}</sub>
      </button>
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
  
  .recently-viewed__item {
    width: 100%;
    border-right: solid 1px;
    border-radius: unset;
    display: flex;
    flex-direction: column;
  }
  .recently-viewed__item > * {
    pointer-events: none;
  }
  .recently-viewed__item sub {
    opacity: 0.6;
  }
</style>
