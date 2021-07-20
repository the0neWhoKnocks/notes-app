<script>
  import ModifyNav from './ModifyNav';
  
  export let content = undefined;
  export let id = undefined;
  export let path = undefined;
  export let title = undefined;
  export let truncated = false;
  
  function parseContent(c) {
    const markup = window.marked(c);
    return truncated
      ? window.DOMPurify.sanitize(markup.substring(0, 50))
      : markup;
  }
</script>

<article class="note-blurb">
  <header>
    {title}
    <ModifyNav {id} {path} type="note" />
  </header>
  <section>{@html parseContent(content)}</section>
</article>

<style>
  .note-blurb {
    border: solid 1px;
    margin: 0.5em;
  }
  
  .note-blurb header {
    font-size: 1.2em;
    font-weight: bold;
    padding: 0.5em;
    border-bottom: solid 1px;
    position: relative;
  }
  
  .note-blurb section {
    padding: 1em;
  }
</style>
