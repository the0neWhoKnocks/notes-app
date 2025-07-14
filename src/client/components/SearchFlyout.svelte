<script>
  import {
    BASE_DATA_NODE,
    DATA_TYPE__GROUP,
    DATA_TYPE__NOTE,
  } from '../../constants';
  import {
    allTags,
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
  
  function searchData(query, { groups, notes } = {}, matches, path = BASE_DATA_NODE) {
    if (!matches) {
      matches = { groups: [], notes: [], tags: [] };
      query = query.toLowerCase();
      
      Object.keys($allTags).forEach((tag) => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          const title = tag.replace(new RegExp(`(${query})`, 'gi'), '<mark>$1</mark>');
          matches.tags.push({ type: 'tag', tag, title });
        }
      });
    }
    
    if (groups) {
      Object.entries(groups).forEach(([groupId, group]) => {
        const _path = `${path}/${groupId}`;
        
        if (groupId.toLowerCase().includes(query)) {
          const title = group.groupName.replace(new RegExp(`(${query})`, 'gi'), '<mark>$1</mark>');
          matches.groups.push({
            type: DATA_TYPE__GROUP,
            path: _path,
            subTitle: _path.replace(BASE_DATA_NODE, ''),
            title,
          });
        }
        
        searchData(query, group, matches, _path);
      });
    }
    
    if (notes) {
      Object.entries(notes).forEach(([ noteId, note ]) => {
        const noteRef = (note.draft) ? note.draft : note;
        const matchedTitle = noteRef.title.toLowerCase().includes(query);
        const matchedContent = noteRef.content.toLowerCase().includes(query);
        
        if (matchedTitle || matchedContent) {
          const _path = `${path}/${noteId}`;
          const obj = {
            type: DATA_TYPE__NOTE,
            path: _path,
            subTitle: _path.replace(BASE_DATA_NODE, ''),
          };
          
          if (matchedTitle) {
            obj.title = noteRef.title.replace(new RegExp(`(${query})`, 'gi'), '<mark>$1</mark>');
          }
          else obj.title = noteRef.title;
          
          if (matchedContent) {
            obj.content = [...noteRef.content.matchAll(new RegExp(query, 'gi'))]
              .map((m) => {
                const match = m[0];
                const ndx = m.index;
                const textPad = 10;
                let startNdx = ndx - textPad;
                let endNdx = ndx + match.length + textPad;
                
                if (startNdx < 0) startNdx = 0;
                if (endNdx > noteRef.content.length) endNdx = noteRef.content.length;
                
                let str = noteRef.content.substring(startNdx, endNdx);
                str = str.replace(new RegExp(`(${match})`, 'gi'), '<mark>$1</mark>');
                
                return str;
              });
            obj.content = `${obj.content.join(' ... ')}`;
          }
          
          matches.notes.push(obj);
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
    <SearchInput focused onSearch={handleSearch} placeholder="Note, Group, or Tag name" />
    <div class="search-results">
      {#each results as {groups, notes, tags}}
        {#if tags.length}
          {#each tags as tag}
            <SearchResult {...tag} />
          {/each}
        {/if}
        {#if notes.length}
          {#each notes as note}
            <SearchResult {...note} />
          {/each}
        {/if}
        {#if groups.length}
          {#each groups as group}
            <SearchResult {...group} />
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
  
  :global([flyout-for="search"] .flyout__body .search > button) {
    width: auto;
    border-color: #000;
    background: var(--color--app--bg);
  }
  
  .search-results {
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
</style>
