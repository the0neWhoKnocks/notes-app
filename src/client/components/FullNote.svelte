<script>
  import {
    currentNote,
    recentlyViewedOpen,
  } from '../stores'; 
  import FindNav from './FindNav.svelte';
  import Icon, { ICON__SEARCH } from './Icon.svelte';
  import ModifyNav from './ModifyNav.svelte';
  import NoteTag from './NoteTag.svelte';
  
  let findNavOpen = false;
  let searchedNote = '';
  
  function handleFindClick() {
    findNavOpen = true;
  }
  
  function handleFindClose() {
    findNavOpen = false;
  }
  
  function handleSearch(matchedText) {
    searchedNote = matchedText;
  }
</script>

{#if !$recentlyViewedOpen && $currentNote && $currentNote.content}
  <article class="full-note" data-prismjs-copy="&#10697; Copy">
    <header>
      {$currentNote.title}
      <nav class="full-note__nav">
        <button on:click={handleFindClick}>
          <Icon type="{ICON__SEARCH}" />
        </button>
        <ModifyNav
          id={$currentNote.id}
          path={$currentNote.path}
          type="note"
        />
      </nav>
      {#if findNavOpen}
        <FindNav
          onClose={handleFindClose}
          onSearch={handleSearch}
          selector=".full-note__body"
        />
      {/if}
    </header>
    {#if $currentNote.tags && $currentNote.tags.length}
      <div class="full-note__tags">
        {#each $currentNote.tags as tag}
          <NoteTag rounded strokeWidth="2" text={tag} />
        {/each}
      </div>
    {/if}
    <section class="full-note__body">
      {@html (searchedNote || window.marked.parse($currentNote.content))}
    </section>
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
  
  :global(.full-note header .find-nav) {
    border: solid 1px;
    position: absolute;
    top: 3px;
    right: 3px;
    z-index: 100;
  }
  
  .full-note__nav {
    display: flex;
  }
  .full-note__nav > button {
    padding: 0.25em;
    display: flex;
  }
  :global(.full-note__nav .modify-nav) {
    margin-left: 0.75em;
  }
  
  .full-note__tags {
    padding: 0.5em;
    display: flex;
    gap: 0.5em;
    flex-wrap: wrap;
  }
  :global(.full-note__tags .note-tag) {
    font-weight: bold;
  }
  
  .full-note__body {
    height: 100%;
    overflow: auto;
    padding: 1em;
    position: relative;
  }
  :global(.full-note__body a) {
    word-break: break-word;
  }
  :global(.full-note__body mark) {
    text-shadow: none;
    border-radius: 0.2em;
  }
</style>
