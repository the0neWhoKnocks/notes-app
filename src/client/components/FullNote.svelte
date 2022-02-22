<script>
  import {
    currentNote,
    recentlyViewedOpen,
  } from '../stores'; 
  import ModifyNav from './ModifyNav.svelte';
  import Tag from './Tag.svelte';
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
          <Tag rounded strokeWidth="2" text={tag} />
        {/each}
      </div>
    {/if}
    <section class="full-note__body">{@html window.marked.parse($currentNote.content)}</section>
  </article>
{/if}

<style>
  .full-note {
    width: 100%;
    color: var(--color--app--fg);
    overflow: hidden;
    border: solid 1px;
    margin: 1em;
    display: flex;
    flex-direction: column;
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
  :global(.full-note__tags .tag) {
    --tag--bg-color: #5c8c8c;
    --tag--border-color: #aec4d6;
    --tag--text-color: #fff;
    
    font-weight: bold;
  }
  :global(.full-note__tags .tag text) {
    text-shadow: 0 2px 2px #11242b;
    paint-order: stroke;
    stroke: #263e3e;
    stroke-width: 4px;
  }
  
  .full-note__body {
    height: 100%;
    overflow: auto;
    padding: 1em;
  }
  :global(.full-note__body a) {
    word-break: break-word;
  }
</style>
