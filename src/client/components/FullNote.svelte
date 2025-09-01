<script>
  import {
    DATA_TYPE__NOTE,
    PRISMAJS__COPY_TEXT,
  } from '../../constants';
  import {
    currentNote,
    recentlyViewedOpen,
  } from '../stores';
  import FindNav from './FindNav.svelte';
  import Icon, { ICON__PRINT, ICON__SEARCH } from './Icon.svelte';
  import ModifyNav from './ModifyNav.svelte';
  import NoteTag from './NoteTag.svelte';
  
  let findNavOpen = $state.raw(false);
  let prevNotePath;
  let searchedNote = $state.raw();
  
  let note = $derived(($currentNote?.draft) ? $currentNote.draft : $currentNote);
  
  function handlePrintClick() {
    window.print();
  }
  
  function handleFindClick() {
    findNavOpen = true;
    prevNotePath = note.path;
  }
  
  function handleFindClose() {
    findNavOpen = false;
    prevNotePath = undefined;
    searchedNote = undefined;
  }
  
  function handleSearch(matchedText) {
    searchedNote = matchedText;
  }
  
  $effect.pre(() => {
    if (findNavOpen && prevNotePath !== $currentNote?.path) handleFindClose();
  });
</script>

{#if !$recentlyViewedOpen && note?.content}
  <article class="full-note" id="note" data-prismjs-copy={`${PRISMAJS__COPY_TEXT}`}>
    <header>
      {note.title}
      <nav class="full-note__nav">
        <ModifyNav
          draft={$currentNote.draft}
          id={$currentNote.id}
          path={$currentNote.path}
          type={DATA_TYPE__NOTE}
        />
        <button onclick={handlePrintClick} title="Print Note">
          <Icon type={ICON__PRINT} />
        </button>
        <button onclick={handleFindClick} title="Search Note">
          <Icon type={ICON__SEARCH} />
        </button>
      </nav>
      {#if findNavOpen}
        <FindNav
          onClose={handleFindClose}
          onSearch={handleSearch}
          selector=".full-note__body"
        />
      {/if}
    </header>
    {#if note?.tags.length}
      <div class="full-note__tags">
        {#each note.tags as tag (tag)}
          <NoteTag rounded strokeWidth="2" text={tag} />
        {/each}
      </div>
    {/if}
    <section class="full-note__body">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html (searchedNote || window.marked.parse(note.content))}
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
    gap: 0.25em;
    align-self: flex-start;
  }
  .full-note__nav > button {
    padding: 0.25em;
    display: flex;
  }
  :global(.full-note__nav .modify-nav) {
    margin-right: 1em;
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
  
  /* Preview in DevTools > CTRL+SHIFT+P > Rendering > Emulate CSS media type: print */
  @media print {
    :global(*) {
      color: black !important;
      text-shadow: none !important;
      background: transparent !important;
    }
    
    :global(body) {
      background: white !important;
    }
    
    :global(.root) {
      box-shadow: unset !important;
    }
    
    :global(.top-nav),
    :global(.toc),
    :global(.code-toolbar .toolbar),
    :global(.code-toolbar .line-numbers-rows),
    :global(.full-note__nav) {
      display: none !important;
    }
    
    :global(.user-content) {
      height: auto !important;
      overflow: visible !important;
    }
    
    :global(.full-note) {
      border: unset !important;
      overflow-x: hidden !important;
      overflow-y: visible !important;
    }
    
    :global(.full-note__body code),
    :global(.code-toolbar pre) {
      border: solid 1px !important;
      box-shadow: none !important;
    }
    
    :global(.code-toolbar pre) {
      white-space: break-spaces !important;
      line-break: anywhere !important;
      padding: 2em 1em 1em !important;
    }
    
    :global(.code-toolbar pre code) {
      border: unset !important;
    }
  }
</style>
