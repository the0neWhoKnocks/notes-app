<script>
  import { currentNote } from '../stores'; 
  import ModifyNav from './ModifyNav.svelte';
  
  let content;
  let id;
  let path;
  let title;
  
  $: if ($currentNote) {
    const note = $currentNote;
    content = window.marked.parse(note.content);
    id = note.id;
    path = note.path;
    title = note.title;
  }
  else {
    content = undefined;
    id = undefined;
    path = undefined;
    title = undefined
  }
</script>

{#if content}
  <article class="full-note">
    <header>
      {title}
      <ModifyNav {id} {path} type="note" />
    </header>
    <section>{@html content}</section>
  </article>
{/if}

<style>
  .full-note {
    width: 100%;
    color: var(--color--app--fg);
    overflow-y: auto;
    border: solid 1px;
  }
  
  .full-note header {
    font-size: 1.2em;
    font-weight: bold;
    padding: 0.5em;
    border-bottom: solid 1px;
    background: var(--color--app--bg);
    display: flex;
    justify-content: space-between;
    position: sticky;
    top: 0;
  }
  
  .full-note section {
    padding: 1em;
  }
</style>
