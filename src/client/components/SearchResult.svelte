<script>
  import {
    DATA_TYPE__GROUP,
    DATA_TYPE__NOTE,
  } from '../../constants';
  import {
    loadNote,
    loadTaggedNotes,
  } from '../stores';
  import Icon, {
    ICON__FILE,
    ICON__FOLDER,
  } from './Icon.svelte';
  import NoteTag from './NoteTag.svelte';
  
  let {
    content = undefined,
    path = undefined,
    subTitle = undefined,
    tag = undefined,
    title = undefined,
    type = undefined,
  } = $props();
  
  function handleClick() {
    if (type === DATA_TYPE__NOTE) loadNote(path);
    else loadTaggedNotes(tag);
  }
</script>

<button
  class="search-result"
  disabled={type === DATA_TYPE__GROUP}
  data-path={path}
  data-tag={tag}
  onclick={handleClick}
>
  <div class="search-result__header">
    {#if type === DATA_TYPE__GROUP}
      <Icon type={ICON__FOLDER} />
    {:else if type === 'tag'}
      <NoteTag rounded text="&nbsp;" />
    {:else}
      <Icon type={ICON__FILE} />
    {/if}
    <div class="search-result__title">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html title}
    </div>
    {#if subTitle}
      <sub>{subTitle}</sub>
    {/if}
  </div>
  {#if content}
    <div class="search-result__content">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html content}
    </div>
  {/if}
</button>

<style>
  .search-result {
    color: var(--color--app--fg);
    text-align: left;
    padding: 1em;
    border: solid 1px;
    background: var(--color--app--bg);
  }
  .search-result > * {
    pointer-events: none;
  }
  .search-result:disabled {
    opacity: 0.5;
  }
  :global(.search-result mark) {
    padding: 0.1em 0.25em;
    border-radius: 0.25em;
    display: inline-block;
  }
  
  .search-result__header {
    font-size: 1.25rem;
    line-height: 1em;
    display: grid;
    grid-gap: 0.25em;
    grid-template-columns: 1em auto;
    align-items: center;
  }
  :global(.search-result__header .note-tag) {
    --color--tag--bg: var(--color--app--fg);
    height: 0.5em;
    display: flex;
  }
  
  .search-result__header sub {
    color: var(--color--app--fg);
    opacity: 0.4;
    font-size: 0.75em;
    grid-column: 2;
  }
  
  .search-result__content {
    opacity: 0.75;
    padding-top: 1em;
    border-top: dashed 1px;
    margin-top: 0.5em;
  }
</style>
