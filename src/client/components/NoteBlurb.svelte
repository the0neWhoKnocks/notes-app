<script>
  export let title = undefined;
  export let content = undefined;
</script>

<article class="note-blurb">
  <header>{title}</header>
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
  }
  .note-blurb section {
    padding: 0.5em;
  }
</style>
