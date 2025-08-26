<script>
  import {
    allTags,
    currentTag,
    getNoteBlurbs,
  } from '../stores';
  import NoteBlurb from './NoteBlurb.svelte';
  
  let list = $derived(($currentTag) ? getNoteBlurbs($allTags[$currentTag]) : undefined);
</script>

{#if list}
  <div class="tagged-notes">
    <h3>{list.length} {#if list.length === 1}Note{:else}Notes{/if} Tagged with "{$currentTag}"</h3>
    <div class="tagged-notes__blurbs">
      {#each list as item (item)}
        <NoteBlurb {...item} />
      {/each}
    </div>
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
  
  .tagged-notes__blurbs {
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
</style>
