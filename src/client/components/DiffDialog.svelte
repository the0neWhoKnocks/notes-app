<script>
  import {
    ROUTE__API__USER__DATA__SET,
  } from '../../constants';
  import {
    dialogDataForDiff,
    noteGroups,
    userData,
    userPreferences,
  } from '../stores';
  import postData from '../utils/postData';
  import serializeForm from '../utils/serializeForm';
  import Dialog from './Dialog.svelte';
  import Diffs from './Diffs.svelte';
  
  export let onDiscard = undefined;
  
  let formRef;
  
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
  
  async function handleSubmit() {
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
      const {
        notesData,
        preferences,
      } = await postData(formRef.getAttribute('action'), payload);
      noteGroups.set(notesData);
      userPreferences.set(preferences);
      closeDialog();
    }
    catch (err) {
      alert(err.message);
      if (err.stack) throw (err);
    }
  }
  
  function transformNotePath({ path }) {
    const ICON__FILE = '&#x01F4C4;';
    const ICON__FOLDER = '&#x01F4C2;';
    const markup = path
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
    <form
      action={ROUTE__API__USER__DATA__SET}
      bind:this={formRef}
      class="diff-form"
      method="POST"
      on:submit|preventDefault={handleSubmit}
      slot="dialogBody"
    >
      <input type="hidden" name="username" value={$userData.username} />
      <input type="hidden" name="password" value={$userData.password} />
      <input type="hidden" name="action" value="applyOfflineChanges" />
      <input type="hidden" name="type" value="all" />
      
      Looks like you made some changes while you were offline.
      <ul>
        <li>All checked items will be saved.</li>
        <li>Any unchecked changes will be discarded.</li>
      </ul>
      
      <div>
        {#if (
          $dialogDataForDiff.prefsDiff.added.length
          || $dialogDataForDiff.prefsDiff.modified.length
          || $dialogDataForDiff.prefsDiff.removed.length
        )}
          <div class="diff-form__section">
            <header>Preferences</header>
            <Diffs diffs={$dialogDataForDiff.prefsDiff} type="preferences" />
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
        <button type="button" on:click={discardChanges}>Discard All</button>
        <button>Apply</button>
      </nav>
    </form>
  </Dialog>
{/if}

<style>
  .diff-form {
    width: 30vw;
    max-height: 80vh;
    overflow: auto;
    padding: 1em;
    display: flex;
    flex-direction: column;
  }
  
  .diff-form ul {
    margin-top: 0.25em;
  }
  
  .diff-form__section {
    border: solid 1px var(--bg-color--app);
  }
  .diff-form header {
    color: var(--fg-color--app);
    padding: 0.25em 0.5em;
    background: var(--bg-color--app);
  }
  
  .diff-form__btm-nav {
    display: flex;
    justify-content: space-between;
  }
  .diff-form__btm-nav button {
    width: 49%;
  }
</style>
