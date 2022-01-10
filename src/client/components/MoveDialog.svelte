<script>
  import { BASE_DATA_NODE } from '../../constants';
  import parsePath from '../../utils/parsePath';
  import {
    dialogDataForMove,
    noteGroups,
    updateItemPath,
  } from '../stores';
  import transformNoteData from '../utils/transformNoteData';
  import Dialog from './Dialog.svelte';
  import GroupList from './GroupList.svelte';
  import MoveNav from './MoveNav.svelte';
  
  let currentPathPrefix = '';
  let currentPathSuffix = '';
  let moveGroupListData = [];
  let newPathPrefix = '';
  let newPathSuffix = '';
  let newRawPath = '';
  let path;
  let type;
  
  function closeMoveDialog() {
    moveGroupListData = [];
    newPathPrefix = '';
    newPathSuffix = '';
    newRawPath = '';
    dialogDataForMove.set();
  }
  
  async function handleMoveSubmit() {
    updateItemPath({
      id: currentPathSuffix,
      newParentPath: `${BASE_DATA_NODE}${newPathPrefix.replace(/\/$/, '')}`,
      oldParentPath: `${BASE_DATA_NODE}${currentPathPrefix.replace(/\/$/, '')}`,
      type,
    });
  }
  
  function handleMoveSelectClick(newPath) {
    newRawPath = `${newPath}/${currentPathSuffix}`;
    const { prefix, suffix } = parsePath(newRawPath);
    newPathPrefix = prefix;
    newPathSuffix = suffix;
  }
  
  $: if ($dialogDataForMove) {
    const dDFM = $dialogDataForMove;
    path = dDFM.path;
    type = dDFM.type;
    
    const { prefix, suffix } = parsePath(path);
    currentPathPrefix = prefix;
    currentPathSuffix = suffix;
    moveGroupListData = transformNoteData(
      $noteGroups,
      {
        currentPath: path.replace(/\/[^/]+$/, ''),
        groupComponent: MoveNav,
        omitNotes: true,
        onClick: handleMoveSelectClick,
      }
    );
  }
  else {
    currentPathPrefix = '';
    currentPathSuffix = '';
    moveGroupListData = [];
    newPathPrefix = '';
    newPathSuffix = '';
    newRawPath = '';
  }
</script>

{#if $dialogDataForMove}
  <Dialog for="moveTo" onCloseClick={closeMoveDialog}>
    <div class="move-to">
      <div class="move-to__title">
        Move {type}
        <code>
          {currentPathPrefix}<mark>{currentPathSuffix}</mark>
        </code>
        to:
        {#if newPathSuffix}
          <code>
            {newPathPrefix}<mark>{newPathSuffix}</mark>
          </code>
        {/if}
      </div>
      <GroupList data={moveGroupListData} expanded />
      <nav class="move-to__btm-nav">
        <button on:click={closeMoveDialog}>Cancel</button>
        <button
          disabled={!newPathSuffix}
          on:click={handleMoveSubmit}
        >Move</button>
      </nav>
    </div>
  </Dialog>
{/if}

<style>
  :global([dialog-for="moveTo"] .dialog__body) {
    padding: 0.5em;
  }
  .move-to {
    min-width: 50vw;
    max-height: 80vh;
    font-family: monospace;
    font-size: 1.3rem;
    overflow-y: auto;
    padding: 0.25em 0.5em 0.5em;
    border: solid 1px;
  }
  
  .move-to__title {
    font-size: 0.8em;
  }
  .move-to__title code {
    color: var(--color--app--fg);
    padding: 0.2em 0.5em;
    border-radius: 0.25em;
    background: var(--color--app--bg);
  }
  :global(.move-to__title mark) {
    color: #7af0fd;
    font-weight: bold;
    background: transparent;
  }
  
  .move-to__btm-nav {
    font-size: 1.2rem;
    padding-top: 0.5em;
    border-top: solid 1px;
    margin-top: 0.5em;
    display: flex;
    gap: 0.5em;
  }
  .move-to__btm-nav button {
    width: 100%;
  }
  .move-to__btm-nav button:disabled {
    opacity: 0.5;
  }
  
  :global([dialog-for="moveTo"] .group__name:hover) {
    background: rgba(0, 0, 0, 0.1);
  }
  
  :global(.move-nav button) {
    font-size: 1.2rem;
    padding: 0.25em 0.75em;
    opacity: 0.5;
  }
  :global(.move-nav button:disabled) {
    opacity: 0.2;
  }
  :global([dialog-for="moveTo"] .group__name:hover .move-nav button:not(:disabled)) {
    opacity: 1;
  }
</style>
