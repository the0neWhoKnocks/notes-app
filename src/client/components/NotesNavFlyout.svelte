<script>
  import { notesNavFlyoutOpen } from '../stores';
  import Flyout from './Flyout.svelte';
  import NotesNav from './NotesNav.svelte';
  
  function handleClose() {
    notesNavFlyoutOpen.set(false);
  }
</script>

{#if $notesNavFlyoutOpen}
  <Flyout
    for="notesNav"
    onCloseClick={handleClose}
  >
    <NotesNav />
  </Flyout>
{/if}

<style>
  :global([flyout-for="notesNav"] .flyout__body) {
    font-size: 1.5rem;
  }
</style>
