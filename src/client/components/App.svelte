<script>
  import { onMount } from 'svelte';
  import getPathNode from '../../utils/getPathNode';
  import logger from '../../utils/logger';
  import initMarked from '../marked/init';
  import {
    checkLoggedInState,
    currentNotes,
    dialogDataForDelete,
    dialogDataForGroup,
    dialogDataForNote,
    noteGroups,
    offline,
    syncOfflineData,
    trackNetworkStatus,
    userData,
    userIsLoggedIn,
  } from '../stores.js';
  import DeleteDialog from './DeleteDialog.svelte';
  // import DiffDialog from './DiffDialog.svelte';
  import GroupDialog from './GroupDialog.svelte';
  import LoginDialog from './LoginDialog.svelte';
  import NoteBlurb from './NoteBlurb.svelte';
  import NoteDialog from './NoteDialog.svelte';
  import NotesFlyout from './NotesFlyout.svelte';
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
      }, 0);
    }
    catch ({ message }) { alert(message); }
  }
  
  // async function discardOfflineChanges() {
  //   ignoreOfflineChanges = true;
  //   await loadNotes();
  //   ignoreOfflineChanges = false;
  // }
  
  function delegateClick({ target }) {
    if (target.dataset) {
      const { action, btnType, id, path, type } = target.dataset;
      
      if (btnType === 'modifyBtn') {
        const { content, groupName, title } = getPathNode($noteGroups, path)[`${type}s`][id];
        
        switch (action) {
          case 'delete': {
            dialogDataForDelete.set({ groupName, id, path, title, type });
            break;
          }
          
          case 'edit': {
            if (type === 'note') {
              dialogDataForNote.set({ action: 'edit', content, path, title });
            }
            else if (type === 'group') {
              dialogDataForGroup.set({ action: 'edit', content, name: groupName, path });
            }
            break;
          }
        }
      }
    }
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
        <div class="app__title">{appTitle}</div>
        <ThemeSelector />
        <UserNav />
      </nav>
      <section class="user-content" on:click={delegateClick}>
        <NotesFlyout />
        <section class="current-grouped-notes">
        	{#if $currentNotes && $currentNotes.notes && Object.keys($currentNotes.notes).length}
            {#each Object.entries($currentNotes.notes) as [noteId, note]}
              <NoteBlurb content={note.content} id={noteId} path={$currentNotes.path} title={note.title}  />
            {/each}
          {:else}
            There are no notes in this group
          {/if}
        </section>
      </section>
    {/if}
    
    <LoginDialog />
    <UserProfileDialog />
    <NoteDialog />
    <GroupDialog />
    <DeleteDialog />
    
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
  
  :global(.root) {
    max-width: 800px;
    margin: auto;
    box-shadow: 0 0 3em 2em;
    position: relative;
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
    background: var(--color--app--bg);
    display: flex;
    flex-direction: column;
  }
  
  .app__title {
    width: 100%;
    font-size: 1.25em;
    font-weight: bold;
  }
  
  .top-nav {
    color: var(--color--app--fg);
    padding: 0.25em 0.5em;
    border-bottom: solid 1px;
    display: flex;
  }
  
  .user-content {
    height: 100%;
    overflow: hidden;
    display: flex;
  }
  
  .current-grouped-notes {
    width: 100%;
    height: 100%;
    color: var(--color--app--fg);
    overflow: auto;
    padding: 1em;
  }
</style>
