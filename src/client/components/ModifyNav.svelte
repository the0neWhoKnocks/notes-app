<script>
  export let id = undefined;
  export let path = undefined;
  export let type = undefined;
</script>

<nav class="modify-nav">
  <button
    type="button"
    data-action="edit"
    data-btn-type="modifyBtn"
    data-id={id}
    data-path={path}
    data-type={type}
  >E</button>
  <button
    type="button"
    data-action="delete"
    data-btn-type="modifyBtn"
    data-id={id}
    data-path={path}
    data-type={type}
  >X</button>
</nav>

<style>
  .modify-nav {
    visibility: hidden;
    display: flex;
  }
  :global(
    .note-blurb header:hover .modify-nav,
    .note-group__header:hover .modify-nav
  ) {
    visibility: visible;
  }
  :global(.note-blurb header .modify-nav) {
    position: absolute;
    top: 0.25em;
    right: 0.25em;
  }
  
  .modify-nav button {
    font-size: 0.75em;
    padding: 0.25em 0.5em;
  }
</style>