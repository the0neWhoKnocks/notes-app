<script>
  import { onMount } from 'svelte';
  import logger from '../utils/logger';
  import {
    NAMESPACE__STORAGE__USER,
    // ROUTE__API__HELLO,
  } from '../constants';
  import Icon, {
    ICON__ANGLE_DOWN,
    ICON__ANGLE_UP,
    ICON__USER,
  } from './components/Icon.svelte';
  import LoginDialog from './components/LoginDialog.svelte';
  import NoteBlurb from './components/NoteBlurb.svelte';
  import NoteGroups from './components/NoteGroups.svelte';
  // import UserDataDialog from './components/UserDataDialog.svelte';
  import UserProfileDialog from './components/UserProfileDialog.svelte';
  import { currentNoteGroupNotes } from './stores.js';
  import {
    getStorageType,
    setStorage,
  } from './utils/storage';
  
  export let appTitle = '';
  
  const log = logger('app');
  // let loginCompOpened = false;
  let userStorageType;
  let mounted = false;
  let username;
  let userNavOpen = false;
  let userDataOpened = false;
  let userInfo;
  let userProfileOpened = false;
  let userIsLoggedIn = false;
  
  // function callAPI() {
  //   fetch(`${ROUTE__API__HELLO}?name=hal`)
  //     .then(resp => resp.json())
  //     .then(data => {
  //       log.info('API', JSON.stringify(data));
  //     })
  //     .catch(err => {
  //       log.error(err);
  //       alert(err);
  //     });
  // }
  
  function setUserInfo() {
    userStorageType = getStorageType(NAMESPACE__STORAGE__USER);
    
    if (userStorageType) {
      userInfo = JSON.parse(window[userStorageType].getItem(NAMESPACE__STORAGE__USER));
      username = userInfo.username;
      userIsLoggedIn = true;
    }
  }
  
  // function openLogin() {
  //   loginCompOpened = true;
  // }
  function closeLogin() {
    // loginCompOpened = false;
    userStorageType = getStorageType(NAMESPACE__STORAGE__USER);
  }
  function handleLogin() {
    setUserInfo();
    closeLogin();
    log.info('USER', 'logged in');
  }
  
  function logoutUser() {
    window[userStorageType].removeItem(NAMESPACE__STORAGE__USER);
    userStorageType = undefined;
    userNavOpen = false;
    userIsLoggedIn = false;
    log.info('USER', 'logged out');
  }
  
  function toggleUserNav() {
    userNavOpen = !userNavOpen;
  }
  
  // function openUserData() {
  //   userDataOpened = true;
  // }
  // function closeUserData() {
  //   userDataOpened = false;
  // }
  // function handleUserDataUpdate() {
  //   closeUserData();
  //   log.info('USER', 'data updated');
  // }
  
  function openUserProfile() {
    userProfileOpened = true;
  }
  function closeUserProfile() {
    userProfileOpened = false;
  }
  function handleProfileUpdate(data) {
    const persistent = getStorageType(NAMESPACE__STORAGE__USER) === 'localStorage';
    setStorage({
      data,
      key: NAMESPACE__STORAGE__USER,
      persistent,
    });
    
    userInfo = data;
    username = data.username;
    
    closeUserProfile();
    
    log.info('USER', `profile updated: ${JSON.stringify(data)}`);
  }
  
  $: if (userProfileOpened || userDataOpened) {
    userNavOpen = false;
  }
  
  onMount(async () => {
    log.info('App starting');
    
    setUserInfo();
    
    mounted = true;
  });
</script>

<div class="app">
  {#if mounted}
    {#if userIsLoggedIn}
      <nav class="top-nav">
        <div class="app-title">{appTitle}</div>
        <div class="user-menu">
          <button on:click={toggleUserNav}>
            <Icon type={ICON__USER} />
            <div class="username">{username}</div>
            {#if userNavOpen}
              <Icon type={ICON__ANGLE_UP} />
            {:else}
              <Icon type={ICON__ANGLE_DOWN} />
            {/if}
          </button>
          <nav class:open={userNavOpen}>
            <button on:click={openUserProfile}>Profile</button>
            <button on:click={logoutUser}>Logout</button>
          </nav>
        </div>
      </nav>
      <section class="user-content">
        <NoteGroups />
        <section class="grouped-notes">
          {#if $currentNoteGroupNotes.length}
            {#each $currentNoteGroupNotes as note}
              <NoteBlurb content={note.content} title={note.title}  />
            {/each}
          {:else}
            No notes for group
          {/if}
        </section>
      </section>
    {/if}
    
    {#if !userIsLoggedIn}
      <LoginDialog
        onClose={closeLogin}
        onSuccess={handleLogin}
      />
    {/if}
    <!-- {#if userDataOpened}
      <UserDataDialog
        onClose={closeUserData}
        onError={closeUserData}
        onSuccess={handleUserDataUpdate}
        {userInfo}
      />
    {/if} -->
    {#if userProfileOpened}
      <UserProfileDialog
        onClose={closeUserProfile}
        onError={closeUserProfile}
        onSuccess={handleProfileUpdate}
        {userInfo}
      />
    {/if}
  {/if}
</div>

<style>
  :root {
    --bg-color--app: #333;
    --fg-color--app: #eee;
  }

  .app {
    width: 100%;
    height: 100%;
    background: var(--bg-color--app);
    display: flex;
    flex-direction: column;
  }
  
  .app-title {
    width: 100%;
    font-size: 1.25em;
    font-weight: bold;
  }
  
  .top-nav {
    color: var(--fg-color--app);
    padding: 0.25em 0.5em;
    border-bottom: solid 1px;
    display: flex;
  }
  .top-nav button {
    position: relative;
  }
  .top-nav button {
    border: solid 1px;
  }
  
  .user-menu {
    margin-left: 0.25em;
    position: relative;
  }
  .user-menu > button {
    height: 100%;
    color: currentColor;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  :global(.user-menu > button svg) {
    font-size: 1.1em;
  }
  .user-menu nav {
    --nav-padding: 0.25em;
    
    min-width: 100%;
    padding: var(--nav-padding);
    padding-top: 0;
    border: solid 1px;
    border-top: none;
    margin: 0;
    background: var(--bg-color--app);
    position: absolute;
    top: calc(100% + var(--nav-padding));
    right: 0;
    opacity: 0;
    transform: translateY(-20%);
    transition: opacity 200ms, transform 200ms;
    visibility: hidden;
  }
  .user-menu nav.open {
    opacity: 1;
    transform: translateY(0%);
    visibility: visible;
  }
  .user-menu nav button {
    width: 100%;
    color: currentColor;
    white-space: nowrap;
    background: transparent;
  }
  .user-menu .username {
    padding: 0 0.5em;
  }
  
  .user-content {
    height: 100%;
    overflow: hidden;
    display: flex;
  }
  
  .grouped-notes {
    width: 100%;
    height: 100%;
    color: var(--fg-color--app);
    padding: 1em;
  }
</style>
