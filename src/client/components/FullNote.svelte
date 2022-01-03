<script>
  import {
    currentNote,
    recentlyViewedOpen,
  } from '../stores'; 
  import ModifyNav from './ModifyNav.svelte';
</script>

{#if !$recentlyViewedOpen && $currentNote && $currentNote.content}
  <article class="full-note">
    <header>
      {$currentNote.title}
      <ModifyNav
        id={$currentNote.id}
        path={$currentNote.path}
        type="note"
      />
    </header>
    {#if $currentNote.tags && $currentNote.tags.length}
      <div class="full-note__tags">
        {#each $currentNote.tags as tag}
          <div class="full-note__tag">{tag}</div>
        {/each}
      </div>
    {/if}
    <section>{@html window.marked.parse($currentNote.content)}</section>
  </article>
{/if}

<style>
  .full-note {
    width: 100%;
    color: var(--color--app--fg);
    overflow-y: auto;
    border: solid 1px;
    margin: 1em;
  }
  
  .full-note header,
  .full-note__tags {
    border-bottom: solid 1px;
  }
  
  .full-note header {
    font-size: 1.2em;
    font-weight: bold;
    padding: 0.5em;
    background: var(--color--app--bg);
    display: flex;
    justify-content: space-between;
    position: sticky;
    top: 0;
  }
  
  .full-note__tags {
    padding: 0.5em;
    display: flex;
    gap: 0.5em;
    flex-wrap: wrap;
  }
  
  .full-note__tag {
    padding: 0 0.75em;
    border: solid 1px;
    border-radius: 0.25em;
  }
  
  .full-note section {
    padding: 1em;
  }
</style>
