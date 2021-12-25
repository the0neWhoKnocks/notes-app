<script>
  import Flyout from './Flyout.svelte';
  import NoteGroups from './NoteGroups.svelte';
  import NotesNav from './NotesNav.svelte';
  
  let flyoutOpen = false;
  
  function handleToggle() {
    flyoutOpen = !flyoutOpen;
  }
</script>

<button on:click={handleToggle}>&gt;</button>
<Flyout
  for="notes"
  open={flyoutOpen}
  onCloseClick={handleToggle}
>
  <NotesNav />
  <NoteGroups />
</Flyout>

<style>
  :global([flyout-for="notes"] .flyout__body) {
    font-size: 1.5rem;
  }
</style>
