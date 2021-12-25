<script>
  import {
    offline,
    openUserProfile,
  } from '../stores.js';
</script>

{#if !$offline}
  <button on:click={openUserProfile}>Profile</button>
{/if}
