<script>
  import {
    loadNote,
    loadTaggedNotes,
  } from '../stores';
  import Icon, {
    ICON__FILE,
    ICON__FOLDER,
  } from './Icon.svelte';
  import Tag from './Tag.svelte';
  
  export let content = undefined;
  export let path = undefined;
  export let subTitle = undefined;
  export let tag = undefined;
  export let title = undefined;
  export let type = undefined;
  
  function handleClick() {
    if (type === 'note') loadNote(path);
    else loadTaggedNotes(tag);
  }
</script>

<button
  class="search-result"
  disabled={type === 'group'}
  data-path={path}
  data-tag={tag}
  on:click={handleClick}
>
  <div class="search-result__header">
    {#if type === 'group'}
      <Icon type={ICON__FOLDER} />
    {:else if type === 'tag'}
      <Tag rounded text="&nbsp;" />
    {:else}
      <Icon type={ICON__FILE} />
    {/if}
    <div class="search-result__title">
      {@html title}
    </div>
    {#if subTitle}
      <sub>{subTitle}</sub>
    {/if}
  </div>
  {#if content}
    <div class="search-result__content">{@html content}</div>
  {/if}
</button>

<style>
  .search-result {
    color: var(--color--app--bg);
    text-align: left;
    padding: 1em;
    border: solid 1px;
    background: #ddd;
  }
  .search-result > * {
    pointer-events: none;
  }
  .search-result:disabled {
    opacity: 0.5;
  }
  .search-result:not(:disabled):hover,
  .search-result:not(:disabled):focus {
    outline-color: var(--color--app--bg);
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
  :global(.search-result__header .tag) {
    --tag--bg-color: #666;
    height: 0.5em;
    display: flex;
  }
  
  .search-result__header sub {
    color: #666;
    font-size: 0.75em;
    grid-column: 2;
  }
  
  .search-result__content {
    color: rgba(0, 0, 0, 0.5);
    padding-top: 1em;
    border-top: dashed 1px;
    margin-top: 0.5em;
  }
</style>
