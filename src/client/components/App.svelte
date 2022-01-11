<script>
  import { onMount } from 'svelte';
  import { BASE_DATA_NODE } from '../../constants';
  import logger from '../../utils/logger';
  import initMarked from '../marked/init';
  import {
    checkLoggedInState,
    initialUserDataLoaded,
    loadNote,
    loadTaggedNotes,
    noteGroups,
    offline,
    syncOfflineData,
    trackNetworkStatus,
    updateHistory,
    userData,
    userIsLoggedIn,
  } from '../stores';
  import getParams from '../utils/getParams';
  import DeleteDialog from './DeleteDialog.svelte';
  // import DiffDialog from './DiffDialog.svelte';
  import FullNote from './FullNote.svelte';
  import GroupDialog from './GroupDialog.svelte';
  import LoginDialog from './LoginDialog.svelte';
  import MoveDialog from './MoveDialog.svelte';
  import NoteDialog from './NoteDialog.svelte';
  import NotesMenuBtn from './NotesMenuBtn.svelte';
  import NotesNavFlyout from './NotesNavFlyout.svelte';
  import RecentlyViewed from './RecentlyViewed.svelte';
  import SearchBtn from './SearchBtn.svelte';
  import SearchFlyout from './SearchFlyout.svelte';
  import TaggedNotes from './TaggedNotes.svelte';
  import ThemeSelector from './ThemeSelector.svelte';
  import UserNav from './UserNav.svelte';
  import UserProfileDialog from './UserProfileDialog.svelte';
  
  export let appTitle = '';
  
  const log = logger('App');
  let mounted = false;
  let swActivated = false;
  let swError = false;
  let swInstalling = false;
  // let ignoreOfflineChanges = false;
  
  // function diff(objA, objB, { diffs, parentObjB, parentPath = '' } = {}) {
  //   let _objB = objB;
  //   if (!_objB) {
  //     const objBKeys = Object.keys(parentObjB);
  //     for (let i=0; i<objBKeys.length; i++) {
  //       const prop = objBKeys[i];
  //       const obj = parentObjB[prop];
  //       if (obj.created === objA.created) {
  //         _objB = obj;
  //         break;
  //       }
  //     }
  //   }
  // 
  //   const objAKeys = Object.keys(objA);
  //   const _diffs = diffs || {
  //     added: [],
  //     modified: [],
  //     removed: [],
  //   };
  // 
  //   if (!_objB) {
  //     _diffs.added.push({ obj: objA, path: parentPath });
  //   }
  //   else {
  //     const objBKeys = Object.keys(_objB);
  // 
  //     if (objBKeys.length > objAKeys.length) {
  //       objBKeys.forEach((prop) => {
  //         if (!objA[prop]) {
  //           const _parentPath = parentPath ? `${parentPath}/${prop}` : prop;
  //           _diffs.removed.push({ obj: _objB[prop], path: _parentPath });
  //         }
  //       });
  //     }
  // 
  //     objAKeys.forEach(prop => {
  //       const valA = objA[prop];
  //       const valB = _objB[prop];
  // 
  //       if (
  //         typeof valA === 'boolean'
  //         || typeof valA === 'number'
  //         || typeof valA === 'string'
  //       ) {
  //         if (
  //           prop !== 'modified' // already know that it's changed, don't need to track this
  //           && valA !== valB
  //         ) {
  //           _diffs.modified.push({
  //             from: valB,
  //             path: parentPath ? parentPath : prop,
  //             prop,
  //             to: valA,
  //           });
  //         }
  //       }
  //       else {
  //         diff(valA, valB, {
  //           diffs: _diffs,
  //           parentObjB: _objB,
  //           parentPath: parentPath ? `${parentPath}/${prop}` : prop,
  //         });
  //       }
  //     });
  //   }
  // 
  //   return _diffs;
  // }
  
  // function diffData(serverData, offlineData) {
  //   const serverJSON = JSON.stringify(serverData);
  //   const offlineJSON = JSON.stringify(offlineData);
  // 
  //   if (serverJSON !== offlineJSON) {
  //     const {
  //       notesData: serverNotesData,
  //       preferences: serverPreferences,
  //     } = serverData;
  //     const {
  //       notesData: offlineNotesData,
  //       preferences: offlinePreferences,
  //     } = offlineData;
  // 
  //     try {
  //       return {
  //         notesDiff: diff(offlineNotesData, serverNotesData),
  //         prefsDiff: diff(offlinePreferences, serverPreferences),
  //       };
  //     }
  //     catch (err) {
  //       console.error(err);
  //     }
  //   }
  // }
  
  async function loadNotes() {
    try {
      await syncOfflineData($userData);
    
      setTimeout(() => {
        // run highlight manually to make plugins kick in
        window.Prism.highlightAll();
        
        log.info('Notes loaded and formatted');
        
        const { note, tag } = getParams(location.href);
        if (note) loadNote(note);
        else if (tag) loadTaggedNotes(tag);
        
        initialUserDataLoaded.set(true);
      }, 0);
    }
    catch ({ message }) { alert(message); }
  }
  
  // async function discardOfflineChanges() {
  //   ignoreOfflineChanges = true;
  //   await loadNotes();
  //   ignoreOfflineChanges = false;
  // }
  
  function handleAppTitleClick(ev) {
    ev.preventDefault();
    updateHistory();
  }
  
  $: if ($userIsLoggedIn) loadNotes();
  
  onMount(async () => {
    log.info('App starting');
    
    initMarked();
    trackNetworkStatus();
    
    // function ensureDB() {
    //   return window.sw.initAPIData($userData);
    // }
    // window.sw.onActivated(async () => {
    //   swInstalling = false;
    //   swActivated = true;
    // 
    //   await ensureDB();
    // 
    //   setTimeout(() => {
    //     swActivated = false;
    //   }, 1000);
    // });
    // window.sw.onError(() => {
    //   swError = true;
    // });
    // window.sw.onInstall(() => {
    //   swInstalling = true;
    // });
    // window.sw.onRegistered(async () => {
    //   await ensureDB();
    //   loadNotes();
    // });
    // window.sw.register();
    
    checkLoggedInState();
    
    mounted = true;
  });
</script>

<div class="app">
  {#if mounted}
    {#if $userIsLoggedIn}
      <nav class="top-nav">
        <div class="app__title">
          <a
            class="app__title-link"
            href="/"
            on:click={handleAppTitleClick}
          >
            <img src="/imgs/favicons/android-chrome-192x192.png" alt="logo" />
            {appTitle}
          </a>
        </div>
        <SearchBtn />
        <NotesMenuBtn />
        <ThemeSelector />
        <UserNav />
      </nav>
      <section class="user-content">
        <section class="user-content__body">
          {#if (
            $noteGroups 
            && $noteGroups[BASE_DATA_NODE]
            && (
              !Object.keys($noteGroups[BASE_DATA_NODE].groups).length
              && !Object.keys($noteGroups[BASE_DATA_NODE].notes).length
            )
          )}
            <div class="start-msg">
              Looks like you haven't added any notes yet. You can do so through
              the <NotesMenuBtn /> menu above.
            </div>
          {/if}
          <RecentlyViewed />
          <FullNote />
          <TaggedNotes />
        </section>
      </section>
    {/if}
    
    <SearchFlyout />
    <NotesNavFlyout />
    <LoginDialog />
    <UserProfileDialog />
    <NoteDialog />
    <GroupDialog />
    <DeleteDialog />
    <MoveDialog />
    
    <!-- {#if $dialogDataForDiff}
      <DiffDialog
        onDiscard={discardOfflineChanges}
      />
    {/if} -->
  {/if}
  
  <div
    class="status-msg"
    class:error={swError}
    class:offline={$offline}
    class:sw-actived={swActivated}
    class:sw-installing={swInstalling}
  >
    {#if swError}
      [SW] Error
    {:else if swInstalling}
      [SW] Installing
    {:else if swActivated}
      [SW] Activated
    {:else if $offline}
      Offline
    {:else}
      &nbsp;
    {/if}
  </div>
</div>

<style>
  :root {
    --color--app--bg: #333;
    --color--app--fg: #eee;
  }
  
  :global(body) {
    background: #666;
  }
  
  :global(button) {
    color: var(--color--app--fg);
    border: solid 1px;
    border-radius: 0.25em;
    background: var(--color--app--bg);
  }
  :global(button:not(:disabled):hover),
  :global(button:not(:disabled):focus) {
    outline: solid 1px var(--color--app--fg);
    outline-offset: -6px;
  }
  :global(form button) {
    width: 100%;
  }
  
  :global(.root) {
    width: 100vw;
    max-width: 800px;
    margin: auto;
    box-shadow: 0 0 3em 2em;
    position: relative;
  }
  
  .start-msg {
    color: var(--color--app--fg);
    font-size: 1.25rem;
    padding: 1.5em;
  }
  :global(.start-msg .notes-menu-btn) {
    font-size: 0.8em;
    vertical-align: bottom;
    padding: 0.25em 0.5em;
    display: inline-flex;
  }
  
  .status-msg {
    padding: 0.25em 0.5em;
    border: dashed 1px #9a4900;
    border-radius: 0.5em;
    background: #ffc800;
    position: fixed;
    bottom: 0.5em;
    right: 0.5em;
    z-index: 50;
    transition: transform 300ms;
    transform: translateY(150%);
  }
  .status-msg.offline,
  .status-msg.sw-actived,
  .status-msg.sw-installing {
    transform: translateY(0%);
  }
  .status-msg.error {
    color: yellow;
    font-weight: bold;
    text-shadow: 0px 2px 5px black;
    border-color: yellow;
    border-width: 2px;
    border-style: double;
    background: #ff4545;
  }

  .app {
    width: 100%;
    height: 100%;
    border: solid 1px var(--color--app--fg);
    border-top: none;
    border-bottom: none;
    background: var(--color--app--bg);
    display: flex;
    flex-direction: column;
  }
  
  .app__title {
    width: 100%;
    font-size: 1.25em;
    font-weight: bold;
  }
  
  .app__title-link {
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.25em;
  }
  .app__title-link img {
    height: 1em;
  }
  
  .top-nav {
    color: var(--color--app--fg);
    border-bottom: solid 1px;
    display: flex;
  }
  :global(.top-nav > *) {
    padding: 0.25em 0.5em;
  }
  :global(.top-nav > *:not(.app__title)) {
    line-height: 1em;
    border-left: solid 1px;
    border-radius: unset;
  }
  :global(.top-nav > .drop-down:last-of-type) {
    margin-right: 0.25em;
  }
  :global(.top-nav > button) {
    color: inherit;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    gap: 0.5em;
  }
  
  .user-content {
    height: 100%;
    overflow: hidden;
    display: flex;
  }
  
  .user-content__body {
    width: 100%;
    height: 100%;
    display: flex;
  }
</style>
