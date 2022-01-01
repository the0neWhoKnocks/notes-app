<script>
  import { notesNavFlyoutOpen } from '../stores.js';
  import Icon, { ICON__MENU } from './Icon.svelte';

  function openFlyout() {
    notesNavFlyoutOpen.set(!$notesNavFlyoutOpen);
  }
</script>

<button class="notes-menu-btn" on:click={openFlyout}>
  <Icon type={ICON__MENU} />
  Notes
</button>

<style>
  .notes-menu-btn {
    padding: 0.25em 1em;
  }
</style>