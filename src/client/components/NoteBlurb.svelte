<script>
  import ModifyNav from './ModifyNav';
  
  export let content = undefined;
  export let id = undefined;
  export let path = undefined;
  export let title = undefined;
</script>

<article class="note-blurb">
  <header>
    {title}
    <ModifyNav {id} {path} type="note" />
    <!-- <nav class="note-blurb__nav">
      <button
        type="button"
        data-type="blurbBtn"
        data-action="edit"
        data-id={id}
        data-path={path}
      >E</button>
      <button
        type="button"
        data-type="blurbBtn"
        data-action="delete"
        data-id={id}
        data-path={path}
      >X</button>
    </nav> -->
  </header>
  <section>{content}</section>
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
    white-space: pre;
    padding: 0.5em;
  }
</style>
