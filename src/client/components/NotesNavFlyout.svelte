<script>
  import { notesNavFlyoutOpen } from '../stores';
  import Flyout from './Flyout.svelte';
  import NotesNav from './NotesNav.svelte';
  
  function handleToggle() {
    notesNavFlyoutOpen.set(!$notesNavFlyoutOpen);
  }
</script>

<Flyout
  for="notesNav"
  open={$notesNavFlyoutOpen}
  onCloseClick={handleToggle}
>
  <NotesNav />
</Flyout>

<style>
  :global([flyout-for="notesNav"] .flyout__body) {
    font-size: 1.5rem;
  }
</style>
