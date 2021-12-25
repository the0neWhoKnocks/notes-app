<script>
  import {
    userData,
    userNavOpen,
    userProfileOpened,
  } from '../stores.js';
  import Icon, {
    ICON__ANGLE_DOWN,
    ICON__ANGLE_UP,
    ICON__USER,
  } from './Icon.svelte';
  import ExportButton from './ExportButton.svelte';
  import ImportButton from './ImportButton.svelte';
  import LogoutButton from './LogoutButton.svelte';
  import ProfileButton from './ProfileButton.svelte';
  
  let userNavRef;
  
  function toggleUserNav() {
    userNavOpen.set(!$userNavOpen);
  }
  
  function handleOuterClick({ target }) {
    if ($userNavOpen) {
      const outerClick = !userNavRef.contains(target);
      if (outerClick) userNavOpen.set(false);
    }
  }
  
  $: if ($userProfileOpened) userNavOpen.set(false);
</script>

<svelte:window on:click={handleOuterClick} />

<div class="user-nav" bind:this={userNavRef}>
  <button class="user-nav__toggle" on:click={toggleUserNav}>
    <Icon type={ICON__USER} />
    <div class="username">{$userData?.username}</div>
    {#if $userNavOpen}
      <Icon type={ICON__ANGLE_UP} />
    {:else}
      <Icon type={ICON__ANGLE_DOWN} />
    {/if}
  </button>
  <nav class:open={$userNavOpen}>
    <ProfileButton />
    <ImportButton />
    <ExportButton />
    <LogoutButton />
  </nav>
</div>

<style>
  .user-nav {
    margin-left: 0.25em;
    position: relative;
  }
  .user-nav__toggle {
    height: 100%;
    color: currentColor;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  :global(.user-nav__toggle > *) {
    pointer-events: none;
  }
  :global(.user-nav__toggle svg) {
    font-size: 1.1em;
  }
  .user-nav nav {
    --nav-padding: 0.25em;
    
    min-width: 100%;
    padding: var(--nav-padding);
    padding-top: 0;
    border: solid 1px;
    border-top: none;
    margin: 0;
    background: var(--color--app--bg);
    position: absolute;
    z-index: 5;
    top: calc(100% + var(--nav-padding));
    right: 0;
    opacity: 0;
    transform: translateY(-20%);
    transition: opacity 200ms, transform 200ms;
    visibility: hidden;
  }
  .user-nav nav.open {
    opacity: 1;
    transform: translateY(0%);
    visibility: visible;
  }
  :global(.user-nav nav button) {
    width: 100%;
    color: currentColor;
    white-space: nowrap;
    border: solid 1px;
    background: transparent;
  }
  .user-nav .username {
    line-height: 1em;
    padding: 0 0.5em;
  }
</style>
