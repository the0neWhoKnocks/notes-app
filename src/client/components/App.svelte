<script>
  import { onDestroy, onMount } from 'svelte';
  import {
    NAMESPACE__STORAGE__USER,
    ROUTE__API__USER_GET_DATA,
  } from '../../constants';
  import getPathNode from '../../utils/getPathNode';
  import logger from '../../utils/logger';
  import {
    currentNoteGroupNotes,
    deleteDialogData,
    groupDialogData,
    noteDialogData,
    noteGroups,
    userData,
  } from '../stores.js';
  import postData from '../utils/postData';
  import {
    getStorageType,
    setStorage,
  } from '../utils/storage';
  import DeleteDialog from './DeleteDialog.svelte';
  import GroupDialog from './GroupDialog.svelte';
  import Icon, {
    ICON__ANGLE_DOWN,
    ICON__ANGLE_UP,
    ICON__USER,
  } from './Icon.svelte';
  import LoginDialog from './LoginDialog.svelte';
  import NoteBlurb from './NoteBlurb.svelte';
  import NoteDialog from './NoteDialog.svelte';
  import NoteGroups from './NoteGroups.svelte';
  import UserProfileDialog from './UserProfileDialog.svelte';
  
  export let appTitle = '';
  
  const log = logger('app');
  let userStorageType;
  let mounted = false;
  let userNavOpen = false;
  let userProfileOpened = false;
  let userIsLoggedIn = false;
  
  function setUserInfo() {
    userStorageType = getStorageType(NAMESPACE__STORAGE__USER);
    
    if (userStorageType) {
      const _userData = JSON.parse(window[userStorageType].getItem(NAMESPACE__STORAGE__USER));
      userIsLoggedIn = true;
      
      userData.set(_userData);
    }
  }
  
  function closeLogin() {
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
    
    userData.set(data);
    
    closeUserProfile();
    
    log.info('USER', `profile updated: ${JSON.stringify(data)}`);
  }
  
  function delegateClick({ target }) {
    if (target.dataset) {
      const { action, btnType, id, path, type } = target.dataset;
      
      if (btnType === 'modifyBtn') {
        const { content, groupName, title } = getPathNode($noteGroups, path)[`${type}s`][id];
        
        switch (action) {
          case 'delete': {
            deleteDialogData.set({ groupName, id, path, title, type });
            break;
          }
          
          case 'edit': {
            if (type === 'note') {
              noteDialogData.set({ action: 'edit', content, path, title });
            }
            else if (type === 'group') {
              groupDialogData.set({ action: 'edit', content, name: groupName, path });
            }
            break;
          }
        }
      }
    }
  }
  
  $: if (userProfileOpened) {
    userNavOpen = false;
  }
  
  let currNotes;
	const unsubCurrNotes = currentNoteGroupNotes.subscribe(async data => {
		currNotes = await data;
	});
  
  onMount(async () => {
    log.info('App starting');
    
    setUserInfo();
    
    try {
      const data = await postData(ROUTE__API__USER_GET_DATA, $userData);
      noteGroups.set(data);
    }
    catch ({ message }) { alert(message); }
    
    mounted = true;
  });
  
  onDestroy(unsubCurrNotes);
</script>

<div class="app">
  {#if mounted}
    {#if userIsLoggedIn}
      <nav class="top-nav">
        <div class="app-title">{appTitle}</div>
        <div class="user-menu">
          <button on:click={toggleUserNav}>
            <Icon type={ICON__USER} />
            <div class="username">{$userData.username}</div>
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
      <section class="user-content" on:click={delegateClick}>
        <NoteGroups />
        <section class="current-grouped-notes">
        	{#if currNotes && currNotes.notes && Object.keys(currNotes.notes).length}
            {#each Object.entries(currNotes.notes) as [noteId, note]}
              <NoteBlurb content={note.content} id={noteId} path={currNotes.path} title={note.title}  />
            {/each}
          {:else}
            There are no notes in this group
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
    {#if userProfileOpened}
      <UserProfileDialog
        onClose={closeUserProfile}
        onError={closeUserProfile}
        onSuccess={handleProfileUpdate}
      />
    {/if}
    {#if $noteDialogData}
      <NoteDialog />
    {/if}
    {#if $groupDialogData}
      <GroupDialog />
    {/if}
    {#if $deleteDialogData}
      <DeleteDialog />
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
  
  .current-grouped-notes {
    width: 100%;
    height: 100%;
    color: var(--fg-color--app);
    overflow: auto;
    padding: 1em;
  }
</style>
