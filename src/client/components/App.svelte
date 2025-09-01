<script>
  import { onMount } from 'svelte';
  import { BASE_DATA_NODE } from '../../constants';
  import logger from '../../utils/logger';
  import initMarked from '../marked/init';
  import {
    checkLoggedInState,
    clearOfflineChanges,
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
  import DiffDialog from './DiffDialog.svelte';
  import FullNote from './FullNote.svelte';
  import GroupDialog from './GroupDialog.svelte';
  import ImportButton from './ImportButton.svelte';
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
  
  let { appTitle = '' } = $props();
  
  const log = logger('App');
  let mounted = $state.raw(false);
  let swActivated = $state.raw(false);
  let swError = $state.raw(false);
  let swInstalling = $state.raw(false);
  let swLoadingUpdate = $state.raw(false);
  let swUpdateAvailable = $state.raw(false);
  
  async function loadNotes() {
    try {
      await syncOfflineData($userData);
      
      // run highlight manually to make plugins kick in
      window.Prism.highlightAll();
      
      log.info('Notes loaded and formatted');
      
      const { note, tag } = getParams(location.href);
      if (note) await loadNote(note);
      else if (tag) await loadTaggedNotes(tag);
      
      initialUserDataLoaded.set(true);
    }
    catch ({ message }) { alert(message); }
  }
  
  async function discardOfflineChanges() {
    await clearOfflineChanges();
    await loadNotes();
  }
  
  function handleAppTitleClick(ev) {
    ev.preventDefault();
    updateHistory();
  }
  
  function handleIgnoreWorkerUpdateClick() {
    swUpdateAvailable = false;
  }
  
  function handleUpdateWorkerClick() {
    swUpdateAvailable = false;
    swLoadingUpdate = true;
    window.sw.updateWorker();
  }
  
  async function startSW() {
    if (window.sw?.register) {
      const ensureDB = () => window.sw.initAPIData($userData);
      
      window.sw.onActivated(async () => {
        swInstalling = false;
        swUpdateAvailable = false;
        swActivated = true;
        
        await ensureDB();
        
        swActivated = false;
      });
      
      window.sw.onError(() => {
        swError = true;
      });
      
      window.sw.onInstall(() => {
        if (!swUpdateAvailable) swInstalling = true;
      });
      
      window.sw.onUpdateAvailable(() => {
        swInstalling = false;
        swUpdateAvailable = true;
      });
      
      try {
        await window.sw.register();
        await ensureDB();
      }
      catch (err) {
        if (!(err instanceof window.sw.NotAllowedError)) {
          log.error(`Problem initializing SW:\n${err.stack}`);
        }
      }
    }
  }
  
  $effect(() => {
    if ($userIsLoggedIn) loadNotes();
  });
  
  onMount(async () => {
    log.info('App starting');
    
    initMarked();
    trackNetworkStatus();
    await startSW();
    checkLoggedInState();
    
    mounted = true;
  });
</script>

<div
  class="app"
  class:is--loaded={$initialUserDataLoaded}
  class:sw--updating={swLoadingUpdate}
>
  {#if mounted}
    {#if $userIsLoggedIn && $initialUserDataLoaded}
      <nav class="top-nav">
        <div class="app__title">
          <a
            class="app__title-link"
            href="/"
            onclick={handleAppTitleClick}
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
              the <NotesMenuBtn /> menu or <ImportButton /> old data from the User menu in
              the top menu.
            </div>
          {/if}
          <RecentlyViewed />
          <FullNote />
          <TaggedNotes />
        </section>
      </section>
    {/if}
  {/if}
</div>
<div
  class="status-msg"
  class:error={swError}
  class:offline={$offline}
  class:sw-activated={swActivated}
  class:sw-installing={swInstalling}
  class:sw-update={swUpdateAvailable}
>
  <div class="status-msg__txt">
    {#if swError}
      [SW] Error
    {:else if $offline}
      Offline
    {:else if swActivated}
      [SW] Activated
    {:else if swUpdateAvailable}
      New Version:
      <button onclick={handleIgnoreWorkerUpdateClick}>Ignore</button>
      <button onclick={handleUpdateWorkerClick}>Load</button>
    {:else if swInstalling}
      [SW] Installing
    {:else}
      &nbsp;
    {/if}
  </div>
</div>
<DeleteDialog />
<DiffDialog onDiscard={discardOfflineChanges} />
<GroupDialog />
<MoveDialog />
<NoteDialog />
<NotesNavFlyout />
<LoginDialog />
<SearchFlyout />
<UserProfileDialog />

<style>
  :global(body) {
    --app--max-width: 800px;
    --color--app--bg: #ffffff;
    --color--app--fg: #000000;
    --color--app--highlight: #dadada;
    --color--prism--code-text: #626262;
    --color--prism--lang-bg: #f5f2f0;
    --color--prism--lang-top: 2.8em;
    --color--prism--ln-bg: var(--color--prism--lang-bg);
    --color--prism--ln-left: 0;
    --color--prism--ln-top: 3.3em;
    --color--prism--text: #626262;
    --color--tag--bg: #dbdbdb;
    --color--tag--border: #909090;
    --color--tag--text: #000;
    
    background: #5b5959;
  }
  :global(body.theme-coy) {
    --color--app--bg: #5e4b55;
    --color--app--fg: #f6f9fb;
    --color--app--highlight: #358ccb;
    --color--prism--code-text: #806f77;
    --color--prism--lang-bg: #fdfdfd;
    --color--prism--ln-left: 0.65em;
    --color--prism--ln-top: 2.35em;
    --color--prism--text: #806f77;
    --color--tag--bg: #358ccb;
    --color--tag--border: #6dc2ff;
    --color--tag--text: #eaf6ff;
    
    background: #3e3238;
    
    & :global(pre[class*=language-]) {
      &::after,
      &::before {
        content: none;
      }
      
      :global(& > code) {
        background-image: unset;
      }
    }
  }
  :global(body.theme-dark) {
    --color--app--bg: #cebdac;
    --color--app--fg: #4d4033;
    --color--app--highlight: #bea387;
    --color--prism--code-text: #fff;
    --color--prism--lang-bg: #4d4033;
    --color--prism--lang-top: 3em;
    --color--prism--ln-bg: linear-gradient(90deg, #1f1f1f, #4d4033 17%);
    --color--prism--ln-left: 0.25em;
    --color--prism--ln-top: 3.55em;
    --color--prism--text: #4e4740;
    --color--tag--bg: #ead7c3;
    --color--tag--border: #9d846b;
    --color--tag--text: #826f5b;
    
    background: #887d73;
    
    & :global(pre[class*=language-]:has(+ .toolbar)) {
      border-top: unset;
      border-radius: 0 0 0.5em 0.5em;
    }
    & :global(pre[class*=language-] + .toolbar) {
      border: 0.3em solid #7a6651;
      border-bottom: unset;
      border-radius: 0.5em 0.5em 0 0;
    }
  }
  :global(body.theme-okaidia) {
    --color--app--bg: #4b4d41;
    --color--app--fg: #edf9d9;
    --color--app--highlight: #272822;
    --color--prism--code-text: #7b7d6f;
    --color--prism--lang-bg: #272822;
    --color--prism--ln-top: 3.3em;
    --color--prism--text: #7b7d6f;
    --color--tag--bg: #272822;
    --color--tag--border: #71775c;
    --color--tag--text: #d3dcc4;
    
    background: #33342c;
    
    & :global(pre[class*=language-]:has(+ .toolbar)) {
      border-radius: 0 0 0.3em 0.3em;
    }
    & :global(pre[class*=language-] + .toolbar) {
      border-bottom: unset;
      border-radius: 0.3em 0.3em 0 0;
    }
  }
  :global(body.theme-solarizedlight) {
    --color--app--bg: #e9e5db;
    --color--app--fg: #433a34;
    --color--app--highlight: #cfc9bc;
    --color--prism--code-text: #646158;
    --color--prism--lang-bg: #fdf6e3;
    --color--prism--text: #646158;
    --color--tag--bg: #b0aa9f;
    --color--tag--border: #9d988d;
    --color--tag--text: #524e46;
    
    background: #887d62;
    
    & :global(pre[class*=language-]:has(+ .toolbar)) {
      border-radius: 0 0 0.3em 0.3em;
    }
    & :global(pre[class*=language-] + .toolbar) {
      border-bottom: unset;
      border-radius: 0.3em 0.3em 0 0;
    }
  }
  :global(body.theme-tomorrow) {
    --color--app--bg: #43464f;
    --color--app--fg: #ccc;
    --color--app--highlight: #303238;
    --color--prism--code-text: #6d7079;
    --color--prism--lang-bg: #2d2d2d;
    --color--prism--text: #6d7079;
    --color--tag--bg: #33353d;
    --color--tag--border: #656977;
    --color--tag--text: #e1e1e1;
    
    background: #292b33;
  }
  :global(body.theme-twilight) {
    --color--app--bg: #333;
    --color--app--fg: #eee;
    --color--app--highlight: #141414;
    --color--prism--code-text: #bbb;
    --color--prism--lang-bg: #141414;
    --color--prism--ln-left: 0.25em;
    --color--prism--ln-top: 3.55em;
    --color--prism--text: #bbb;
    --color--tag--bg: #232323;
    --color--tag--border: #919191;
    --color--tag--text: #dcdcdc;
    
    background: #1d1d1d;
    
    & :global(pre[class*=language-]:has(+ .toolbar)) {
      border-top: unset;
      border-radius: 0 0 0.5em 0.5em;
    }
    & :global(pre[class*=language-] + .toolbar) {
      border: 0.3em solid #545454;
      border-bottom: unset;
      border-radius: 0.5em 0.5em 0 0;
    }
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
    max-width: var(--app--max-width);
    margin: auto;
    box-shadow: 0 0 3em 2em rgb(0, 0, 0, 0.35);
    position: relative;
  }
  
  .start-msg {
    color: var(--color--app--fg);
    font-size: 1.25rem;
    padding: 1.5em;
  }
  :global(.start-msg .import-btn),
  :global(.start-msg .notes-menu-btn) {
    font-size: 0.8em;
    vertical-align: bottom;
    padding: 0.25em 0.5em;
    display: inline-flex;
  }
  
  .status-msg {
    border-top: solid 1px rgb(255 255 255 / 10%);
    border-radius: 0.5em 0 0 0.5em;
    background: rgb(255 255 255 / 10%);
    backdrop-filter: blur(5px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: fixed;
    z-index: 50;
    right: 0;
    bottom: 0.5em;
    transition: transform 100ms;
    transform: translateX(0%);
  }
  .status-msg:not(:where(
    .error,
    .offline,
    .sw-activated,
    .sw-installing,
    .sw-update
  )) {
    transform: translateX(100%);
  }
  .status-msg__txt {
    font-weight: bold;
    padding: 0.25em 0.5em;
    border: solid 3px #333;
    border-radius: 0.5em;
    margin: 0.5em;
    background: #fff;
  }
  .status-msg.error {
    background: rgb(255 0 0 / 10%);
  }
  .status-msg.error .status-msg__txt {
    color: #ffe18d;
    text-shadow: 0px 2px 5px black;
    border-color: #ffe18d;
    border-width: 0.25em;
    border-style: double;
    background: #ff4545;
  }
  .status-msg.offline {
    background: rgb(255 224 0 / 10%);
  }
  .status-msg.offline .status-msg__txt {
    border: dashed 1px #9a4900;
    background: #ffc800;
  }
  .status-msg.sw-update .status-msg__txt {
    display: flex;
    gap: 0.5em;
    align-items: center;
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
  .app:not(.is--loaded) {
    display: none;
  }
  .app.sw--updating {
    pointer-events: none;
    user-select: none;
    opacity: 0.5;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  :global(#view):has(.app.sw--updating)::after {
    content: '';
    width: 2em;
    height: 2em;
    border: solid 2px rgb(0 0 0 / 25%);
    border-top-color: #000;
    border-radius: 100%;
    outline: solid 4px #fff;
    background: #fff;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: spin 300ms linear infinite;
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
  
  :global(.app .code-toolbar > .toolbar > .toolbar-item > button) {
    color: var(--color--prism--text);
  }
</style>
