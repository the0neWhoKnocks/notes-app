<script>
  import {
    ROUTE__API__USER_SET_DATA,
  } from '../../constants';
  import {
    deleteDialogData,
    noteGroups,
    userData,
  } from '../stores';
  import postData from '../utils/postData';
  import Dialog from './Dialog.svelte';
  
  let formRef;
  
  function closeDialog() {
    deleteDialogData.set();
  }
  
  function handleCloseClick() {
    closeDialog();
  }
  
  async function handleSubmit() {
    try {
      const { notesData } = await postData(formRef.getAttribute('action'), formRef);
      noteGroups.set(notesData);
      closeDialog();
    }
    catch (err) {
      alert(err.message);
      if (err.stack) throw (err);
    }
  }
</script>

{#if $deleteDialogData}
  <Dialog
    onCloseClick={handleCloseClick}
  >
    <form
      action={ROUTE__API__USER_SET_DATA}
      bind:this={formRef}
      class="delete-form"
      method="POST"
      on:submit|preventDefault={handleSubmit}
      slot="dialogBody"
    >
      <input type="hidden" name="username" value={$userData.username} />
      <input type="hidden" name="password" value={$userData.password} />
      <input type="hidden" name="action" value="delete" />
      <input type="hidden" name="id" value={$deleteDialogData.id} />
      <input type="hidden" name="path" value={$deleteDialogData.path} />
      <input type="hidden" name="type" value={$deleteDialogData.type} />
      
      {#if $deleteDialogData.type === 'note'}
        <div class="delete-form__msg">
          Delete note "{$deleteDialogData.title}" from "{$deleteDialogData.path}"?
        </div>
      {:else}
        <div class="delete-form__msg">
          Delete group "{$deleteDialogData.groupName}" and all the notes in "{$deleteDialogData.path}/{$deleteDialogData.id}"?
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
    width: 30vw;
    overflow: auto;
    padding: 1em;
    display: flex;
    flex-direction: column;
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
