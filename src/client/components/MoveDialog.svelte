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
  
  let currentPathPrefix = $state.raw('');
  let currentPathSuffix = $state.raw('');
  let moveGroupListData = $state.raw([]);
  let newPathPrefix = $state.raw('');
  let newPathSuffix = $state.raw('');
  let newRawPath = $state.raw('');
  let path = $state.raw();
  let type = $state.raw();
  
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
  
  $effect(() => {
    if ($dialogDataForMove) {
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
  });
</script>

{#if $dialogDataForMove}
  <Dialog for="moveTo" onCloseClick={closeMoveDialog}>
    {#snippet s_dialogBody()}
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
          <button onclick={closeMoveDialog}>Cancel</button>
          <button
            disabled={!newPathSuffix}
            onclick={handleMoveSubmit}
          >Move</button>
        </nav>
      </div>
    {/snippet}
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
    margin: 0.5em 0;
  }
  .move-to__title code {
    color: var(--color--app--fg);
    padding: 0.25em 0.5em;
    border: solid 1px var(--color--app--fg);
    border-radius: 0.25em;
    background: var(--color--app--bg);
  }
  :global(.move-to__title mark) {
    color: var(--color--app--fg);
    font-weight: bold;
    text-decoration: underline;
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
  
  :global([dialog-for="moveTo"] .group__name-wrapper) {
    overflow: hidden;
  }
  :global([dialog-for="moveTo"] .group__name-wrapper .svg-icon) {
    flex-shrink: 0;
  }
  :global([dialog-for="moveTo"] .group__name-text) {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  :global([dialog-for="moveTo"] .group__name .move-nav) {
    margin-left: 0.5em;
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
