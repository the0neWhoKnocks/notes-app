<script>
  import {
    DATA_ACTION__APPLY_OFFLINE_CHANGES,
    DATA_TYPE__ALL,
    DATA_TYPE__PREFS,
  } from '../../constants';
  import {
    dialogDataForDiff,
    errorMessage,
    setUserData,
    userData,
  } from '../stores';
  import serializeForm from '../utils/serializeForm';
  import Dialog from './Dialog.svelte';
  import Diffs from './Diffs.svelte';
  
  let { onDiscard = undefined } = $props();
  
  let formRef = $state();
  
  function closeDialog() {
    dialogDataForDiff.set();
  }
  
  function discardChanges() {
    if (onDiscard) onDiscard();
    closeDialog();
  }
  
  function buildChosenDiffsObj(chosenObj, diffsObj) {
    return Object.keys(chosenObj).reduce((obj, diffType) => {
      if (!obj[diffType]) obj[diffType] = [];
      
      chosenObj[diffType].forEach((ndx) => {
        obj[diffType].push(diffsObj[diffType][+ndx]);
      });
      
      return obj;
    }, {});
  }
  
  async function handleSubmit(ev) {
    ev.preventDefault();
    
    const formData = serializeForm(formRef);
    
    if (!formData.changes) return discardChanges();
    
    const {
      changes: { notes, preferences: prefs },
      ...payload
    } = formData;
    const { notesDiff, prefsDiff } = $dialogDataForDiff;
    
    if (notes || prefs) payload.offlineChanges = {};
    if (notes) payload.offlineChanges.notes = buildChosenDiffsObj(notes, notesDiff);
    if (prefs) payload.offlineChanges.prefs = buildChosenDiffsObj(prefs, prefsDiff);
    
    try {
      await setUserData(payload);
      closeDialog();
    }
    catch (err) {
      errorMessage.set(err);
      if (err.stack) throw (err);
    }
  }
  
  function transformNotePath({ path, pathLabel }) {
    const ICON__FILE = '&#x01F4C4;';
    const ICON__FOLDER = '&#x01F4C2;';
    const markup = (pathLabel || path)
      .split('/')
      .reduce((arr, item, ndx, srcArr) => {
        const odd = !!(ndx % 2);
        let icon = '';
        
        if (
          // IF the `root` item
          ndx === 0
          // OR the previous item was the `groups` Array
          || (!odd && srcArr[ndx - 1] === 'groups')
        ) icon = ICON__FOLDER;
        // IF the previous item was the `notes` Array
        else if (!odd && srcArr[ndx - 1] === 'notes') icon = ICON__FILE;
        
        // No need to display the `groups` and `notes` props since they're
        // just for data organization, and they take up extra visual space.
        if (!odd) arr.push(`${icon}${item}`);
        
        return arr;
      }, [])
      .join('/');
    
    return markup;
  }
</script>

{#if $dialogDataForDiff}
  <Dialog
    modal
    title="Offline Changes"
  >
    {#snippet s_dialogBody()}
      <form
        class="diff-form"
        bind:this={formRef}
        onsubmit={handleSubmit}
      >
        <input type="hidden" name="username" value={$userData.username} />
        <input type="hidden" name="password" value={$userData.password} />
        <input type="hidden" name="action" value={DATA_ACTION__APPLY_OFFLINE_CHANGES} />
        <input type="hidden" name="type" value={DATA_TYPE__ALL} />
        
        Looks like you made some changes while you were offline.
        <ul>
          <li>All checked items will be saved.</li>
          <li>Any unchecked changes will be discarded.</li>
        </ul>
        
        <div class="diff-form__sections">
          {#if (
            $dialogDataForDiff.prefsDiff.added.length
            || $dialogDataForDiff.prefsDiff.modified.length
            || $dialogDataForDiff.prefsDiff.removed.length
          )}
            <div class="diff-form__section">
              <header>Preferences</header>
              <Diffs diffs={$dialogDataForDiff.prefsDiff} type={DATA_TYPE__PREFS} />
            </div>
          {/if}
          {#if (
            $dialogDataForDiff.notesDiff.added.length
            || $dialogDataForDiff.notesDiff.modified.length
            || $dialogDataForDiff.notesDiff.removed.length
          )}
            <div class="diff-form__section">
              <header>Notes</header>
              <Diffs
                diffs={$dialogDataForDiff.notesDiff}
                transformPath={transformNotePath}
                type="notes"
              />
            </div>
          {/if}
        </div>
        
        <nav class="diff-form__btm-nav">
          <button type="button" onclick={discardChanges}>Discard All</button>
          <button>Apply</button>
        </nav>
      </form>
    {/snippet}
  </Dialog>
{/if}

<style>
  :root {
    --diff--ui--bg-color: #333;
    --diff--ui--fg-color: #eee;
  }
  
  .diff-form {
    width: calc(var(--app--max-width) - 4em);
    max-height: 80vh;
    overflow: auto;
    padding: 1em;
    display: flex;
    flex-direction: column;
  }
  
  .diff-form ul {
    margin-top: 0.25em;
  }
  
  .diff-form__sections {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  
  .diff-form__section {
    border: solid 1px var(--diff--ui--bg-color);
  }
  .diff-form header {
    color: var(--diff--ui--fg-color);
    padding: 0.25em 0.5em;
    background: var(--diff--ui--bg-color);
  }
  
  .diff-form__btm-nav {
    display: flex;
    justify-content: space-between;
  }
  .diff-form__btm-nav button {
    width: 49%;
    color: var(--diff--ui--fg-color);
    background-color: var(--diff--ui--bg-color);
  }
  .diff-form__btm-nav button:not(:disabled):hover,
  .diff-form__btm-nav button:not(:disabled):focus-visible {
    outline-color: var(--diff--ui--fg-color);
  }
</style>
