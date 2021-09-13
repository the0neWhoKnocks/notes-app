<script>
  import NotesNavDrawer from './NotesNavDrawer.svelte';
  
  export let groupName = '';
  export let groups = undefined;
  export let notes = undefined;
  export let path = 'root';
  export let wrap = true;
  
  const contentCheck = () => !!(Object.keys(groups).length || Object.entries(notes).length);
  let hasContent = contentCheck();
  let _path, groupId, ladder;
  
  $: {
    ladder = path.split('/');
    groupId = ladder.pop();
    _path = ladder.join('/');
    hasContent = contentCheck();
  }
</script>

<NotesNavDrawer {hasContent} {wrap}>
  <div slot="label">{groupName}</div>
  {#if hasContent}
    <ul class="notes-nav-group">
      {#each Object.keys(groups).sort() as groupId, ndx}
        <svelte:self path={`${path}/${groupId}`} {...groups[groupId]} />
      {/each}
      {#each Object.entries(notes) as [noteId, note], ndx}
        <li class="notes-nav-group__item">
          <a href={`?note=${window.encodeURIComponent(`${path}/${noteId}`)}`}>{note.title}</a>
        </li>
      {/each}
    </ul>
  {/if}
</NotesNavDrawer>

<style>
  .notes-nav-group {
    color: var(--color--app--fg);
    margin: 0;
    list-style: none;
  }
  
  .notes-nav-group__item {
    line-height: 1.25em;
    margin-left: 0;
  }
  
  .notes-nav-group__item a {
    display: block;
  }
</style>
