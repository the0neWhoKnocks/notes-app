<script>
  import { BASE_DATA_NODE } from '../../constants';
  import getPathNode from '../../utils/getPathNode';
  import {
    loadNote,
    noteGroups,
    tagsList,
  } from '../stores';
  
  let list;
  
  function handleClick({ target: { dataset: { path } } }) {
    if (path) loadNote(path);
  }
  
  $: if ($tagsList) {
    list = $tagsList.map((path) => {
      const { id, notes } = getPathNode($noteGroups, path);
      return {
        path,
        subTitle: path.replace(BASE_DATA_NODE, ''),
        title: notes[id].title,
      };
    });
  }
  else list = undefined;
</script>

{#if list}
  <div
    class="tagged-notes"
    on:click={handleClick}
  >
    <h3>Tagged Notes ({list.length})</h3>
    {#each list as {path, subTitle, title}}
      <button
        class="note"
        data-path={encodeURIComponent(path)}
      >
        <b>{title}</b>
        <sub>{subTitle}</sub>
      </button>
    {/each}
  </div>
{/if}

<style>
  .tagged-notes {
    width: 100%;
    color: var(--color--app--fg);
    padding: 1em;
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  
  .tagged-notes h3 {
    margin: 0;
  }
  
  .note {
    width: 100%;
    text-align: left;
    padding: 1em;
    border: solid 1px;
  }
  .note > * {
    pointer-events: none;
  }
  .note b {
    display: block;
  }
  .note sub {
    opacity: 0.6;
  }
</style>
