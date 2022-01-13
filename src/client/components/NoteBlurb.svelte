<script>
  import {
    loadNote,
  } from '../stores';

  export let content = undefined;
  export let path = undefined;
  export let subTitle = undefined;
  export let title = undefined;
  
  function parseContent(c) {
    return c.substring(0, 50);
    
    // TODO - maybe remove DOMPurify
    // const markup = window.marked.parse(c);
    // return window.DOMPurify.sanitize(markup.substring(0, 50));
  }
  
  function handleClick({ target: { dataset: { path } } }) {
    if (path) loadNote(path);
  }
</script>

<button
  type="button"
  class="note-blurb"
  data-path={encodeURIComponent(path)}
  on:click={handleClick}
>
  <div class="note-blurb__title">{title}</div>
  <div class="note-blurb__sub-title">{subTitle}</div>
  {#if content}
    <div class="note-blurb__content">
      {@html parseContent(content)}
    </div>
  {/if}
</button>

<style>
  .note-blurb {
    width: 100%;
    border: solid 1px;
    border-radius: unset;
    display: flex;
    flex-direction: column;
  }
  .note-blurb > * {
    width: 100%;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  }
  
  .note-blurb__title {
    font-weight: bold;
  }
  
  .note-blurb__sub-title {
    opacity: 0.6;
  }
  
  .note-blurb__content {
    white-space: pre;
    padding-top: 1em;
    border-top: dashed 1px;
    margin-top: 0.5em;
  }
</style>
