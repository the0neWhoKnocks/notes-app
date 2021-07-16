<script>
  import { currentGroupPath } from '../stores';
  import ModifyNav from './ModifyNav.svelte';
  import NoteBlurb from './NoteBlurb.svelte';
  
  export let groupName = '';
  export let groups = undefined;
  export let notes = undefined;
  export let path = 'root';
  
  const isRoot = path === 'root';
  const ladder = path.split('/');
  const groupId = ladder.pop();
  const _path = ladder.join('/');
  
  function handleNameClick() {
    currentGroupPath.update(() => path);
  }
</script>

<section class="note-group" class:is--root={isRoot}>
  <header class="note-group__header">
    <div
      class="note-group__name"
      on:click={handleNameClick}
    >{groupName}</div>
    <nav class="note-group__nav">
      <button
        title="Add Group"
        data-path={path}
        data-type="addGroupBtn"
      >+ Group</button>
      <button
        title="Add Note"
        data-path={path}
        data-type="addNoteBtn"
      >+ Note</button>
      {#if !isRoot}
        <ModifyNav id={groupId} path={_path} type="group" />
      {/if}
    </nav>
  </header>
  
  {#each Object.keys(groups) as group, ndx}
    {#if isRoot && ndx === 0}
      <hr class="root-separator" />
    {/if}
    <svelte:self path={`${path}/${group}`} {...groups[group]} />
  {/each}
  {#each Object.entries(notes) as [noteId, note], ndx}
    {#if isRoot && ndx === 0}
      <hr class="root-separator" />
    {/if}
    <NoteBlurb content={note.content} id={noteId} {path} title={note.title} truncated  />
  {/each}
</section>

<style>
  .root-separator:first-of-type {
    margin-top: 0;
  }

  .note-group {
    color: var(--fg-color--app);
  }
  
  .note-group__header {
    position: relative;
  }
  
  .note-group__name {
    width: 100%;
    min-height: 1.4em;
    cursor: pointer;
  }
  
  .note-group__nav {
    display: flex;
    position: absolute;
    top: 0;
    right: 0;
  }
  .note-group__nav button {
    white-space: nowrap;
    padding: 0;
  }
  
  .note-group.is--root > .note-group__header {
    border-bottom: solid 1px;
    background: var(--bg-color--app);
    position: sticky;
    top: 0;
    z-index: 1;
  }
  
  .note-group:not(.is--root) {
    padding-left: 0.5em;
  }
  .note-group:not(.is--root) .note-group__nav {
    visibility: hidden;
  }
  .note-group:not(.is--root) .note-group__header:hover .note-group__nav {
    visibility: visible;
  }
</style>
