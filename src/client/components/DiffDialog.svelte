<script>
  import {
    ROUTE__API__USER_SET_DATA,
  } from '../../constants';
  import {
    dialogDataForDiff,
    userData,
  } from '../stores';
  // import postData from '../utils/postData';
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
  
  async function handleSubmit() {
    const payload = serializeForm(formRef);
    
    if (!payload.changes) return discardChanges();
    
    console.log('submit', payload);
    
    // TODO: `modifyUserData` will have to start accepting `created` and `modified`
    // so that synced data behaves like it was added while online.
    
    // try {
    //   const { notesData } = await postData(formRef.getAttribute('action'), formRef);
    //   closeDialog();
    // }
    // catch (err) {
    //   alert(err.message);
    //   if (err.stack) throw (err);
    // }
  }
</script>

{#if $dialogDataForDiff}
  <Dialog
    modal
    title="Offline Changes"
  >
    <form
      action={ROUTE__API__USER_SET_DATA}
      bind:this={formRef}
      class="diff-form"
      method="POST"
      on:submit|preventDefault={handleSubmit}
      slot="dialogBody"
    >
      <input type="hidden" name="username" value={$userData.username} />
      <input type="hidden" name="password" value={$userData.password} />
      
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
            <Diffs diffs={$dialogDataForDiff.notesDiff} type="notes" />
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
