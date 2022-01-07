<script>
  import {
    getNoteBlurbs,
    tagsList,
  } from '../stores';
  import NoteBlurb from './NoteBlurb.svelte';
  
  $: list = ($tagsList) ? getNoteBlurbs($tagsList) : undefined;
</script>

{#if list}
  <div class="tagged-notes">
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
</style>
