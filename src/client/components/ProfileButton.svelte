<script>
  import {
    offline,
    openUserProfile,
  } from '../stores.js';
  import Icon, { ICON__SETTINGS } from './Icon.svelte';
</script>

<button disabled={$offline} on:click={openUserProfile}>
  <Icon type="{ICON__SETTINGS}" /> Profile
</button>
