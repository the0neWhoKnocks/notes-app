<script>
  import { BASE_DATA_NODE } from '../../constants';
  import {
    noteGroups,
    searchFlyoutOpen,
  } from '../stores';
  import Flyout from './Flyout.svelte';
  import SearchInput from './SearchInput.svelte';
  import SearchResult from './SearchResult.svelte';
  
  let results;
  
  function handleClose() {
    searchFlyoutOpen.set(false);
  }
  
  function searchData(query, { groups, notes } = {}, matches, path) {
    if (!matches) {
      matches = { groups: [], notes: [] };
      query = query.toLowerCase();
      path = '';
    }
    
    if (groups) {
      Object.entries(groups).forEach(([groupId, group]) => {
        const _path = `${path}/${groupId}`;
        if (groupId.toLowerCase().includes(query)) {
          matches.groups.push({ type: 'group', item: group, path: _path });
        }
        searchData(query, group, matches, _path);
      });
    }
    
    if (notes) {
      Object.entries(notes).forEach(([noteId, note]) => {
        if (
          noteId.toLowerCase().includes(query)
          || note.content.toLowerCase().includes(query)
        ) {
          const _path = `${path}/${noteId}`;
          matches.notes.push({ type: 'note', item: note, path: _path });
        }
      });
    }
    
    return matches;
  }
  
  function handleSearch(query) {
    results = query
      ? [searchData(query, $noteGroups[BASE_DATA_NODE])]
      : [];
  }
  
  $: if ($searchFlyoutOpen) results = [];
</script>

{#if $searchFlyoutOpen}
  <Flyout
    for="search"
    onCloseClick={handleClose}
  >
    <SearchInput focused onSearch={handleSearch} />
    <div class="search-results">
      {#each results as {groups, notes}}
        {#if groups.length}
          {#each groups as group}
            <SearchResult {...group} />
          {/each}
        {/if}
        {#if notes.length}
          {#each notes as note}
            <SearchResult {...note} />
          {/each}
        {/if}
      {/each}
    </div>
  </Flyout>
{/if}

<style>
  :global([flyout-for="search"] .flyout__body) {
    padding: 1em;
    display: flex;
    gap: 1em;
    flex-direction: column;
  }
  
  :global([flyout-for="search"] .flyout__body .search input),
  :global([flyout-for="search"] .flyout__body .search > button) {
    border-radius: unset;
  }
  
  .search-results {
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
</style>
