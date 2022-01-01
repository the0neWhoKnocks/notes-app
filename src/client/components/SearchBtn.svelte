<script>
  import { searchFlyoutOpen } from '../stores.js';
  import Icon, { ICON__SEARCH } from './Icon.svelte';

  function openFlyout() {
    searchFlyoutOpen.set(!$searchFlyoutOpen);
  }
</script>

<button class="search-btn" on:click={openFlyout}>
  <Icon type={ICON__SEARCH} />
  Search
</button>

<style>
  .search-btn {
    padding: 0.25em 1em 0.25em 0.75em;
  }
</style>