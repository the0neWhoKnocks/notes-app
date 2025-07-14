<script>
  import {
    BASE_DATA_NODE,
    DATA_ACTION__DELETE,
    DATA_TYPE__GROUP,
  } from '../../constants';
  import parsePath from '../../utils/parsePath';
  import {
    deleteNoteData,
    dialogDataForDelete,
    userData,
  } from '../stores';
  import Dialog from './Dialog.svelte';
  
  let formRef;
  
  function closeDialog() {
    dialogDataForDelete.set();
  }
  
  function handleCloseClick() {
    closeDialog();
  }
  
  async function handleSubmit() {
    try {
      await deleteNoteData(formRef);
      closeDialog();
    }
    catch (err) {
      alert(err.message);
      if (err.stack) throw (err);
    }
  }
  
  let groupPath;
  $: if ($dialogDataForDelete) {
    const { path, type } = $dialogDataForDelete;
    
    if (type === DATA_TYPE__GROUP) {
      groupPath = (path.replace(BASE_DATA_NODE, '') || '/');
    }
    else {
      const { rawPrefix } = parsePath(path);
      groupPath = (rawPrefix.replace(BASE_DATA_NODE, '') || '/');
    }
  }
  else groupPath = undefined;
</script>

{#if $dialogDataForDelete}
  <Dialog
    onCloseClick={handleCloseClick}
  >
    <form
      class="delete-form"
      slot="dialogBody"
      bind:this={formRef}
      on:submit|preventDefault={handleSubmit}
    >
      <input type="hidden" name="username" value={$userData.username} />
      <input type="hidden" name="password" value={$userData.password} />
      <input type="hidden" name="action" value={DATA_ACTION__DELETE} />
      <input type="hidden" name="id" value={$dialogDataForDelete.id} />
      <input type="hidden" name="path" value={$dialogDataForDelete.path} />
      <input type="hidden" name="type" value={$dialogDataForDelete.type} />
      
      {#if $dialogDataForDelete.type === 'note'}
        <div class="delete-form__msg">
          Delete note <code>{$dialogDataForDelete.title}</code> from <code>{groupPath}</code>?
        </div>
      {:else}
        <div class="delete-form__msg">
          Delete group <code>{$dialogDataForDelete.groupName}</code> and all the notes in <code>{groupPath}</code>?
        </div>
      {/if}
      <nav class="delete-form__btm-nav">
        <button type="button" on:click={handleCloseClick}>No</button>
        <button>Yes</button>
      </nav>
    </form>
  </Dialog>
{/if}

<style>
  .delete-form {
    width: 70vw;
    max-width: 25em;
    overflow: auto;
    padding: 1em;
    display: flex;
    flex-direction: column;
  }
  
  code {
    line-height: 1em;
    padding: 0.1em 0.25em;
    border: solid 1px;
    border-radius: 0.25em;
    margin: 0 3px;
    display: inline-block;
  }
  
  .delete-form__msg {
    text-align: center;
    padding: 1em;
    border: solid 1px orange;
    background: #fff39e;
  }
  
  .delete-form__btm-nav {
    display: flex;
    justify-content: space-between;
  }
  .delete-form__btm-nav button {
    width: 49%;
  }
</style>
