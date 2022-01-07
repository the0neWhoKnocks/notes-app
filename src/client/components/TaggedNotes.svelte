<script>
  import {
    getNoteBlurbs,
    loadNote,
    tagsList,
  } from '../stores';
  import NoteBlurb from './NoteBlurb.svelte';
  
  function handleClick({ target: { dataset: { path } } }) {
    if (path) loadNote(path);
  }
  
  $: list = ($tagsList) ? getNoteBlurbs($tagsList) : undefined;
</script>

{#if list}
  <div
    class="tagged-notes"
    on:click={handleClick}
  >
    <h3>Tagged Notes ({list.length})</h3>
    {#each list as item}
      <NoteBlurb {...item} />
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
