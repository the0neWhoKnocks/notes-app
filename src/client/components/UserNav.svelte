<script>
  import {
    userData,
    userNavOpen,
    userProfileOpened,
  } from '../stores.js';
  import Icon, { ICON__USER } from './Icon.svelte';
  import DropDown from './DropDown.svelte';
  import ExportButton from './ExportButton.svelte';
  import ImportButton from './ImportButton.svelte';
  import LogoutButton from './LogoutButton.svelte';
  import ProfileButton from './ProfileButton.svelte';
  
  $: if ($userProfileOpened) userNavOpen.set(false);
</script>

<DropDown bind:open={$userNavOpen} class="user-nav">
  <svelte:fragment slot="label">
    <Icon type={ICON__USER} />
    <div class="username">{$userData?.username}</div>
  </svelte:fragment>
  
  <ProfileButton />
  <ImportButton />
  <ExportButton />
  <LogoutButton />
</DropDown>

<style>
  :global(.user-nav .svg-icon.for--user) {
    font-size: 1.1em;
  }
  
  :global(.user-nav nav button) {
    display: flex;
    justify-content: space-around;
  }
</style>
